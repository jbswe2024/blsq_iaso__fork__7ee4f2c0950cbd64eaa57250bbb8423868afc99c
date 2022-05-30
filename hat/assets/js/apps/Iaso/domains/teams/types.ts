import { UrlParams } from '../../types/table';

type SubTeam = {
    id: number;
    name: string;
};
type Users = {
    id: number;
    username: string;
};
export type Team = {
    id: number;
    name: string;
    description?: string;
    manager: number;
    sub_teams: Array<number>;
    sub_teams_details: Array<SubTeam>;
    project: number;
    type?: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS';
    users: Array<number>;
    users_details: Array<Users>;
    created_at: string;
    deleted_at?: string;
    parent?: number;
};
export type TeamFilterParams = {
    dateTo?: string;
    dateFrom?: string;
    project?: number;
};

export type TeamParams = UrlParams &
    TeamFilterParams & {
        select?: (
            // eslint-disable-next-line no-unused-vars
            data: Array<Team>,
        ) => Array<any>;
    };
