from django.http import HttpResponse
from rest_framework.decorators import action

from iaso.models import SourceVersion
from .common import ModelViewSet
from iaso.models import DataSource
from rest_framework import serializers, permissions

from .source_versions_serializers import DiffSerializer


class SourceVersionSerializer(serializers.ModelSerializer):
    """Source versions API

    This API is restricted to authenticated users (no specific permission check)

    GET /api/sourceversions/
    """

    class Meta:
        model = SourceVersion
        fields = ["id", "data_source", "number", "description", "created_at", "updated_at"]

    def validate_data_source(self, value):
        """
        Check that data source belongs to the account
        """
        account = self.context["request"].user.iaso_profile.account
        sources = DataSource.objects.filter(projects__account=account)

        if value not in sources:
            raise serializers.ValidationError("Source does not belong to this account ")
        return value


class SourceVersionViewSet(ModelViewSet):
    """Data source API

    This API is restricted to authenticated users having at least one of the "menupermissions.iaso_mappings",
    "menupermissions.iaso_org_units", and "menupermissions.iaso_links" permissions

    GET /api/datasources/
    GET /api/datasources/<id>
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SourceVersionSerializer
    results_key = "versions"
    queryset = DataSource.objects.all()
    http_method_names = ["get", "post", "put", "head", "options", "trace", "delete"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile

        versions = SourceVersion.objects.filter(data_source__projects__account=profile.account)

        source_id = self.kwargs.get("source", None)
        if source_id:
            versions = versions.filter(data_source_id=source_id)

        return versions.order_by("id")

    @action(methods=["GET", "POST"], detail=False, serializer_class=DiffSerializer, url_path="diff.csv")
    def diff_csv(self, request):
        serializer: DiffSerializer = self.get_serializer(
            data=request.data if request.method == "POST" else request.query_params
        )
        serializer.is_valid(raise_exception=True)
        # FIXME: FileResponse don't work, no idea why, not a priority
        filename = "comparison.csv"
        response = HttpResponse(serializer.generate_csv())
        response["Content-Disposition"] = "attachment; filename=%s" % filename
        return response
