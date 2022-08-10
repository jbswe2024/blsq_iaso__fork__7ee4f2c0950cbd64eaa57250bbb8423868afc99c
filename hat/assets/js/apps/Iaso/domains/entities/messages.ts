import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    age: {
        defaultMessage: 'Age',
        id: 'iaso.label.age',
    },
    id: {
        defaultMessage: 'Identifier',
        id: 'iaso.label.id',
    },
    title: {
        defaultMessage: 'Entities',
        id: 'iaso.entities.title',
    },
    create: {
        defaultMessage: 'Create entity',
        id: 'iaso.entities.create',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    deleteError: {
        id: 'iaso.snackBar.deleteEntityError',
        defaultMessage: 'An error occurred while deleting entity',
    },
    deleteSuccess: {
        id: 'iaso.snackBar.delete_successful',
        defaultMessage: 'Deleted successfully',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    updateMessage: {
        defaultMessage: 'Update entity',
        id: 'iaso.entities.update',
    },
    deleteTitle: {
        id: 'iaso.entities.dialog.deleteTitle',
        defaultMessage: 'Are you sure you want to delete this entity?',
    },
    deleteText: {
        id: 'iaso.label.deleteText',
        defaultMessage: 'This operation cannot be undone.',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    see: {
        defaultMessage: 'See',
        id: 'iaso.label.see',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    types: {
        defaultMessage: 'Types',
        id: 'iaso.entities.types',
    },
    type: {
        defaultMessage: 'Type',
        id: 'iaso.entities.type',
    },
    updated_at: {
        id: 'iaso.forms.updated_at',
        defaultMessage: 'Updated',
    },
    created_at: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    nameRequired: {
        id: 'iaso.pages.errors.name',
        defaultMessage: 'Name is required',
    },
    attributes: {
        defaultMessage: 'Submission',
        id: 'iaso.instance.titleSingle',
    },
    viewInstance: {
        id: 'iaso.forms.viewInstance',
        defaultMessage: 'View submission',
    },
    lastVisit: {
        id: 'iaso.entities.lastVisit',
        defaultMessage: 'Last visit',
    },
    registrationDate: {
        id: 'iaso.entities.registrationDate',
        defaultMessage: 'Registration date',
    },
});

export default MESSAGES;
