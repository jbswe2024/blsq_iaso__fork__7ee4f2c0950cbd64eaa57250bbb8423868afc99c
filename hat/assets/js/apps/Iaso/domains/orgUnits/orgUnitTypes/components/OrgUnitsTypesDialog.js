import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';

import { useSafeIntl } from 'bluesquare-components';

import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import {
    saveOrgUnitType as saveOrgUnitTypeAction,
    createOrgUnitType as createOrgUnitTypeAction,
} from '../actions';
import { useFormState } from '../../../../hooks/form';
import {
    commaSeparatedIdsToArray,
    isFieldValid,
    isFormValid,
} from '../../../../utils/forms';
import { requiredFields } from '../config';

export default function OrgUnitsTypesDialog({
    orgUnitType,
    titleMessage,
    onConfirmed,
    ...dialogProps
}) {
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();

    const { allOrgUnitTypes, allProjects } = useSelector(state => ({
        allOrgUnitTypes: state.orgUnitsTypes.allTypes || [],
        allProjects: state.projects.allProjects || [],
    }));

    const [formState, setFieldValue, setFieldErrors] = useFormState({
        id: orgUnitType.id,
        name: orgUnitType.name,
        short_name: orgUnitType.short_name,
        depth: orgUnitType.depth,
        sub_unit_type_ids: orgUnitType.sub_unit_types.map(unit => unit.id),
        project_ids: orgUnitType.projects.map(project => project.id),
    });

    let projects;
    if (formState.project_ids.value.length > 0) {
        projects = formState.project_ids.value.join(',');
    }

    const onChange = useCallback(
        (keyValue, value) => {
            if (
                keyValue === 'sub_unit_type_ids' ||
                keyValue === 'project_ids'
            ) {
                setFieldValue(keyValue, commaSeparatedIdsToArray(value));
            } else {
                setFieldValue(keyValue, value);
            }

            if (!isFieldValid(keyValue, value, requiredFields)) {
                setFieldErrors(keyValue, [
                    formatMessage(MESSAGES.requiredField),
                ]);
            }
        },
        [setFieldValue, setFieldErrors, formatMessage],
    );

    const onConfirm = useCallback(
        closeDialog => {
            const savePromise =
                orgUnitType.id === null
                    ? dispatch(createOrgUnitTypeAction(formState))
                    : dispatch(saveOrgUnitTypeAction(formState));

            savePromise
                .then(() => {
                    closeDialog();
                    onConfirmed();
                })
                .catch(error => {
                    if (error.status === 400) {
                        Object.entries(error.details).forEach(entry =>
                            setFieldErrors(entry[0], entry[1]),
                        );
                    }
                });
        },
        [dispatch, setFieldErrors, formState],
    );

    const subUnitTypes = allOrgUnitTypes.filter(
        s => s.id !== formState.id.value,
    );

    return (
        <ConfirmCancelDialogComponent
            id="OuTypes-modal"
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            disableConfirm={!isFormValid(requiredFields, formState)}
            {...dialogProps}
        >
            <Grid container spacing={4} justifyContent="flex-start">
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="name"
                        onChange={onChange}
                        value={formState.name.value}
                        errors={formState.name.errors}
                        type="text"
                        label={MESSAGES.name}
                        required
                    />
                </Grid>
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="short_name"
                        onChange={onChange}
                        value={formState.short_name.value}
                        errors={formState.short_name.errors}
                        type="text"
                        label={MESSAGES.shortName}
                        required
                    />
                </Grid>
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="depth"
                        onChange={onChange}
                        value={formState.depth.value}
                        errors={formState.depth.errors}
                        type="number"
                        label={MESSAGES.depth}
                        required
                    />
                </Grid>
                <Grid xs={12} item>
                    <InputComponent
                        multi
                        clearable
                        keyValue="sub_unit_type_ids"
                        // onChange={(name, value) =>
                        //     setFieldValue(name, commaSeparatedIdsToArray(value))
                        // }
                        onChange={onChange}
                        value={formState.sub_unit_type_ids.value}
                        errors={formState.sub_unit_type_ids.errors}
                        type="select"
                        options={subUnitTypes.map(ot => ({
                            value: ot.id,
                            label: ot.name,
                        }))}
                        label={MESSAGES.subUnitTypes}
                    />
                </Grid>
                <Grid xs={12} item>
                    <InputComponent
                        multi
                        clearable
                        keyValue="project_ids"
                        // onChange={(name, value) =>
                        //     setFieldValue(name, commaSeparatedIdsToArray(value))
                        // }
                        onChange={onChange}
                        value={projects}
                        errors={formState.project_ids.errors}
                        type="select"
                        options={
                            allProjects
                                ? allProjects.map(p => ({
                                      label: p.name,
                                      value: p.id,
                                  }))
                                : []
                        }
                        label={MESSAGES.projects}
                        required
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
}
OrgUnitsTypesDialog.propTypes = {
    orgUnitType: PropTypes.object,
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    onConfirmed: PropTypes.func.isRequired,
};
OrgUnitsTypesDialog.defaultProps = {
    orgUnitType: {
        id: null,
        name: '',
        short_name: '',
        sub_unit_types: [],
        projects: [],
        depth: 0,
    },
};
