from enum import Enum

from django.db import transaction
from drf_yasg.utils import swagger_serializer_method
from rest_framework import serializers

from iaso.api.common import DynamicFieldsModelSerializer
from iaso.models.microplanning import Team
from plugins.polio.models import Campaign
from plugins.polio.serializers import CampaignSerializer, UserSerializer
from .models import BudgetStep, BudgetStepFile, BudgetStepLink, send_budget_mails, get_workflow
from .workflow import next_transitions, can_user_transition


class TransitionSerializer(serializers.Serializer):
    key = serializers.CharField()
    # https://github.com/typeddjango/djangorestframework-stubs/issues/78 bug in mypy remove in future
    label = serializers.CharField()  # type: ignore
    help_text = serializers.CharField()  # type: ignore
    allowed = serializers.BooleanField()
    reason_not_allowed = serializers.CharField(required=False)
    required_fields = serializers.ListField(child=serializers.CharField())
    displayed_fields = serializers.ListField(child=serializers.CharField())
    # Note : implemented as a Css class in the frontend
    color = serializers.ChoiceField(choices=["primary", "green", "red"], required=False)


class NestedTransitionSerializer(TransitionSerializer):
    key = serializers.CharField()
    # https://github.com/typeddjango/djangorestframework-stubs/issues/78 bug in mypy remove in future
    label = serializers.CharField()  # type: ignore


class NodeSerializer(serializers.Serializer):
    key = serializers.CharField()
    # https://github.com/typeddjango/djangorestframework-stubs/issues/78 bug in mypy remove in future
    label = serializers.CharField()  # type: ignore


# noinspection PyMethodMayBeStatic
class CampaignBudgetSerializer(CampaignSerializer, DynamicFieldsModelSerializer):
    class Meta:
        model = Campaign
        fields = [
            "created_at",
            "id",
            "obr_name",
            "country_name",
            "current_state",
            "next_transitions",
            "budget_last_updated_at",
            "possible_states",
            "cvdpv2_notified_at",
            "possible_transitions",
        ]
        default_fields = [
            "created_at",
            "id",
            "obr_name",
            "country_name",
            "current_state",
            "budget_last_updated_at",
        ]

    # added via annotation
    budget_last_updated_at = serializers.DateTimeField(required=False, help_text="Last budget update on the campaign")
    current_state = serializers.SerializerMethodField()
    # To be used for override
    possible_states = serializers.SerializerMethodField()
    possible_transitions = serializers.SerializerMethodField()

    next_transitions = serializers.SerializerMethodField()
    # will need to use country__name for sorting
    country_name: serializers.SlugRelatedField = serializers.SlugRelatedField(
        source="country", slug_field="name", read_only=True
    )

    def get_current_state(self, campaign: Campaign):
        workflow = get_workflow()
        try:
            node = workflow.get_node_by_key(campaign.budget_current_state_key)
        except:
            return {
                "key": campaign.budget_current_state_key,
                "label": campaign.budget_current_state_key,
            }
        else:
            return {
                "key": campaign.budget_current_state_key,
                "label": node.label,
            }

    @swagger_serializer_method(serializer_or_field=TransitionSerializer(many=True))
    def get_next_transitions(self, campaign):
        # // get transition from workflow engine.
        workflow = get_workflow()
        transitions = next_transitions(workflow.transitions, campaign.budget_current_state_key)
        user = self.context["request"].user
        for transition in transitions:
            allowed = can_user_transition(transition, user)
            transition.allowed = allowed
            if not allowed:
                transition.reason_not_allowed = "User doesn't have permission"

        return TransitionSerializer(transitions, many=True).data

    # this is used for filter dropdown
    @swagger_serializer_method(serializer_or_field=NodeSerializer(many=True))
    def get_possible_states(self, _campaign):
        workflow = get_workflow()
        nodes = workflow.nodes
        return NodeSerializer(nodes, many=True).data

    # this is used for filter dropdown
    @swagger_serializer_method(serializer_or_field=TransitionSerializer(many=True))
    def get_possible_transitions(self, _campaign):
        workflow = get_workflow()
        transitions = workflow.transitions
        return NestedTransitionSerializer(transitions, many=True).data


class TransitionError(Enum):
    INVALID_TRANSITION = "invalid_transition"
    NOT_ALLOWED = "user_not_allowed"
    MISSING_FIELD = "missing_field"


class BudgetLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetStepLink
        fields = [
            "id",
            "url",
            "alias",
        ]


class TransitionToSerializer(serializers.Serializer):
    transition_key = serializers.CharField()
    campaign = serializers.PrimaryKeyRelatedField(queryset=Campaign.objects.all())
    comment = serializers.CharField(required=False)
    files = serializers.ListField(child=serializers.FileField(), required=False)
    links = serializers.JSONField(required=False)
    amount = serializers.FloatField(required=False)

    def validate(self, attrs):
        return attrs
        pass

    def validate_links(self, value):
        return value

    def save(self, **kwargs):
        data = self.validated_data
        campaign: Campaign = data["campaign"]
        user = self.context["request"].user
        transition_key = data["transition_key"]

        workflow = get_workflow()

        n_transitions = next_transitions(workflow.transitions, campaign.budget_current_state_key)
        # find transition
        transitions = [t for t in n_transitions if t.key == transition_key]
        if not transitions:
            raise serializers.ValidationError(
                {
                    "transition_key": [
                        TransitionError.INVALID_TRANSITION,
                        f"Valid transitions: {[t.key for t in n_transitions]}",
                    ]
                }
            )
        transition = transitions[0]
        if not can_user_transition(transition, user):
            raise serializers.ValidationError({"transition_key": [TransitionError.NOT_ALLOWED]})

        for field in transition.required_fields:
            if field == "attachments":
                if len(data.get("files", [])) < 1 and len(data.get("links", [])) < 1:
                    raise Exception(TransitionError.MISSING_FIELD)
            elif field not in data:
                raise Exception(TransitionError.MISSING_FIELD)

        created_by_team = None
        # first team the user belong to that can make the event
        if transition.teams_ids_can_transition:
            created_by_team = Team.objects.filter(id__in=transition.teams_ids_can_transition).filter(users=user).first()
        if not created_by_team:
            created_by_team = Team.objects.filter(users=user).first()
        # this will raise if not found, should only happen for invalid workflow.
        node = workflow.get_node_by_key(transition.to_node)
        with transaction.atomic():
            step = BudgetStep.objects.create(
                amount=data.get("amount"),
                created_by=user,
                created_by_team=created_by_team,
                campaign=campaign,
                comment=data.get("comment"),
                transition_key=transition.key,
            )
            for link_data in data.get("links", []):
                link_serializer = BudgetLinkSerializer(data=link_data)
                link_serializer.is_valid(raise_exception=True)
                link_serializer.save(step=step)

            campaign.budget_current_state_key = transition.to_node
            for file in data.get("files", []):
                step.files.create(file=file, filename=file.name)
            campaign.budget_current_state_label = node.label
            campaign.save()

            send_budget_mails(step, transition, self.context["request"])
            step.is_email_sent = True
            step.save()

        return step


class BudgetFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetStepFile
        fields = [
            "id",
            "file",  # url
            "filename",
        ]


class BudgetStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetStep
        fields = [
            "id",
            "created_at",
            "created_by_team",
            "created_by",
            "deleted_at",
            "campaign_id",
            "comment",
            "links",
            "files",
            "amount",
            "transition_key",
            "transition_label",
        ]

    transition_label = serializers.SerializerMethodField()
    files = BudgetFileSerializer(many=True)
    links = BudgetLinkSerializer(many=True)
    created_by_team: serializers.SlugRelatedField = serializers.SlugRelatedField(slug_field="name", read_only=True)
    created_by = UserSerializer()

    @swagger_serializer_method(serializer_or_field=serializers.CharField)
    def get_transition_label(self, budget_step: BudgetStep) -> str:
        workflow = get_workflow()
        return workflow.get_transition_label_safe(budget_step.transition_key)


class UpdateBudgetStepSerializer(serializers.ModelSerializer):
    """Update serializer for budget update, the only allowed field is deleted_at to restore it"""

    class Meta:
        model = BudgetStep
        fields = [
            "deleted_at",
        ]
