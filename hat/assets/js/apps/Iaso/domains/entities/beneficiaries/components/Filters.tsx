import React, { useState, FunctionComponent, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { Grid, Button, makeStyles, Box } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

// @ts-ignore
import DatesRange from 'Iaso/components/filters/DatesRange';
import InputComponent from '../../../../components/forms/InputComponent';
import { OrgUnitTreeviewModal } from '../../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

import { redirectTo } from '../../../../routing/actions';
import MESSAGES from '../messages';

import { baseUrl } from '../../config';

import { useGetOrgUnit } from '../../../orgUnits/components/TreeView/requests';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
};

type Props = {
    params: Params;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [filters, setFilters] = useState({
        search: params.search,
        location: params.location,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
    });
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.location);

    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [filtersUpdated, dispatch, filters, params]);

    const handleChange = useCallback(
        (key, value) => {
            setFiltersUpdated(true);
            if (key === 'location') {
                setInitialOrgUnitId(value);
            }
            setFilters({
                ...filters,
                [key]: value,
            });
        },
        [filters],
    );

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                    <Box id="ou-tree-input">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.location}
                            onConfirm={orgUnit =>
                                handleChange(
                                    'location',
                                    orgUnit ? [orgUnit.id] : undefined,
                                )
                            }
                            initialSelection={initialOrgUnit}
                        />
                    </Box>
                </Grid>
                <Grid item xs={3}>
                    <DatesRange
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        onChangeDate={handleChange}
                        labelFrom={MESSAGES.dateFrom}
                        labelTo={MESSAGES.dateTo}
                        dateFrom={filters.dateFrom}
                        dateTo={filters.dateTo}
                    />
                </Grid>
            </Grid>
            <Grid
                container
                spacing={4}
                justifyContent="flex-end"
                alignItems="center"
            >
                <Grid
                    item
                    xs={2}
                    container
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Button
                        data-test="search-button"
                        disabled={!filtersUpdated}
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon className={classes.buttonIcon} />
                        {formatMessage(MESSAGES.search)}
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

export { Filters };
