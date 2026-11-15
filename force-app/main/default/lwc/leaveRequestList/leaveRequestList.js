import { LightningElement, wire, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getLeaveRequests from '@salesforce/apex/LeaveRequestController.getLeaveRequests';
import submitForApproval from '@salesforce/apex/LeaveRequestController.submitForApproval';

const COLUMNS = [
    { label: 'Request No.', fieldName: 'Name', type: 'text' },
    { label: 'Leave Type', fieldName: 'Leave_Type__c', type: 'text' },
    { label: 'Start Date', fieldName: 'Start_Date__c', type: 'date-local' },
    { label: 'End Date', fieldName: 'End_Date__c', type: 'date-local' },
    { label: 'Days', fieldName: 'Leave_Duration__c', type: 'number', initialWidth: 70 },
    { label: 'Status', fieldName: 'Status__c', type: 'text' },
    { label: 'Manager Comments', fieldName: 'Manager_Comments__c', type: 'text' },
    {
        type: 'action',
        typeAttributes: {
            rowActions: (row, doneCallback) => {
                doneCallback(
                    row.Status__c === 'Pending'
                        ? [{ label: 'Submit for Approval', name: 'submit' }]
                        : [{ label: 'No actions available', name: 'none', disabled: true }]
                );
            }
        }
    }
];

export default class LeaveRequestList extends LightningElement {
    columns = COLUMNS;
    allRequests = [];
    searchKey = '';
    statusFilter = 'All';
    isLoading = true;
    error;
    wiredResult;

    statusOptions = [
        { label: 'All', value: 'All' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
    ];

    @wire(getLeaveRequests)
    wiredRequests(result) {
        this.wiredResult = result;
        const { data, error } = result;
        if (data) {
            this.allRequests = data;
            this.error = undefined;
        } else if (error) {
            this.allRequests = [];
            this.error = (error.body && error.body.message) || 'Unable to load leave requests';
        }
        this.isLoading = false;
    }

    // Filtering done in JavaScript: status + free-text search
    get filteredRequests() {
        const key = this.searchKey.trim().toLowerCase();
        return this.allRequests.filter((r) => {
            const statusMatch = this.statusFilter === 'All' || r.Status__c === this.statusFilter;
            const text = [r.Name, r.Leave_Type__c, r.Reason__c, r.Manager_Comments__c]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return statusMatch && (!key || text.includes(key));
        });
    }

    get hasRows() {
        return this.filteredRequests.length > 0;
    }

    countByStatus(status) {
        return this.allRequests.filter((r) => r.Status__c === status).length;
    }
    get pendingLabel() {
        return `Pending: ${this.countByStatus('Pending')}`;
    }
    get approvedLabel() {
        return `Approved: ${this.countByStatus('Approved')}`;
    }
    get rejectedLabel() {
        return `Rejected: ${this.countByStatus('Rejected')}`;
    }

    handleSearch(event) {
        this.searchKey = event.target.value;
    }

    handleStatusChange(event) {
        this.statusFilter = event.detail.value;
    }

    async handleRowAction(event) {
        if (event.detail.action.name !== 'submit') {
            return;
        }
        this.isLoading = true;
        try {
            await submitForApproval({ recordId: event.detail.row.Id });
            this.dispatchEvent(
                new ShowToastEvent({ title: 'Submitted', message: 'Request submitted for approval.', variant: 'success' })
            );
            await refreshApex(this.wiredResult);
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Could not submit',
                    message: (error.body && error.body.message) || 'Unknown error',
                    variant: 'error'
                })
            );
        } finally {
            this.isLoading = false;
        }
    }

    @api
    async refresh() {
        this.isLoading = true;
        await refreshApex(this.wiredResult);
        this.isLoading = false;
    }
}
