import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createLeaveRequest from '@salesforce/apex/LeaveRequestController.createLeaveRequest';
import submitForApproval from '@salesforce/apex/LeaveRequestController.submitForApproval';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default class LeaveRequestForm extends LightningElement {
    leaveType = '';
    startDate = '';
    endDate = '';
    reason = '';
    submitApproval = true;
    isSaving = false;
    errorMessage = '';

    leaveTypeOptions = [
        { label: 'Casual Leave', value: 'Casual Leave' },
        { label: 'Sick Leave', value: 'Sick Leave' },
        { label: 'Earned Leave', value: 'Earned Leave' }
    ];

    // Duration = End Date - Start Date + 1 (same logic as the formula field)
    get duration() {
        if (!this.startDate || !this.endDate) {
            return null;
        }
        const days = Math.round((new Date(this.endDate) - new Date(this.startDate)) / MS_PER_DAY) + 1;
        return days > 0 ? days : null;
    }

    get durationText() {
        return this.duration ? `${this.duration} day(s)` : '-';
    }

    handleChange(event) {
        const { name, value, checked } = event.target;
        if (name === 'submitApproval') {
            this.submitApproval = checked;
        } else {
            this[name] = value;
        }
        this.errorMessage = '';
    }

    isInputValid() {
        // Date range rule
        const endInput = this.template.querySelector('lightning-input[name="endDate"]');
        if (this.startDate && this.endDate && new Date(this.endDate) < new Date(this.startDate)) {
            endInput.setCustomValidity('End Date must be on or after Start Date');
        } else {
            endInput.setCustomValidity('');
        }
        endInput.reportValidity();

        // Required-field checks on all inputs
        const controls = [
            ...this.template.querySelectorAll('lightning-input, lightning-combobox, lightning-textarea')
        ];
        return controls.reduce((valid, control) => control.reportValidity() && valid, true);
    }

    async handleSubmit() {
        this.errorMessage = '';
        if (!this.isInputValid()) {
            return;
        }
        this.isSaving = true;
        let createdId;
        try {
            createdId = await createLeaveRequest({
                leaveType: this.leaveType,
                startDate: this.startDate,
                endDate: this.endDate,
                reason: this.reason
            });
            let message = 'Leave request created.';
            if (this.submitApproval) {
                await submitForApproval({ recordId: createdId });
                message = 'Leave request created and submitted for approval.';
            }
            this.showToast('Success', message, 'success');
            this.resetForm();
        } catch (error) {
            this.errorMessage = this.reduceError(error);
            if (createdId) {
                this.errorMessage = `Request was created, but approval submission failed: ${this.errorMessage}`;
            }
        } finally {
            this.isSaving = false;
            if (createdId) {
                this.dispatchEvent(new CustomEvent('requestcreated'));
            }
        }
    }

    resetForm() {
        this.leaveType = '';
        this.startDate = '';
        this.endDate = '';
        this.reason = '';
        this.errorMessage = '';
        this.template.querySelectorAll('lightning-input, lightning-combobox, lightning-textarea')
            .forEach((c) => c.setCustomValidity && c.setCustomValidity(''));
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    reduceError(error) {
        return (error && error.body && error.body.message) || (error && error.message) || 'Unknown error';
    }
}
