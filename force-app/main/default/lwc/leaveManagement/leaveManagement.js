import { LightningElement } from 'lwc';

export default class LeaveManagement extends LightningElement {
    // When the form creates a request, refresh the list
    handleRequestCreated() {
        const list = this.template.querySelector('c-leave-request-list');
        if (list) {
            list.refresh();
        }
    }
}
