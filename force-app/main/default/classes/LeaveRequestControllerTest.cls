@IsTest
private class LeaveRequestControllerTest {

    @IsTest
    static void createsPendingRequest() {
        Test.startTest();
        Id recordId = LeaveRequestController.createLeaveRequest(
            'Casual Leave', Date.newInstance(2026, 11, 10), Date.newInstance(2026, 11, 12), 'Family function');
        Test.stopTest();

        Leave_Request__c saved = [
            SELECT Status__c, Leave_Duration__c, Employee__c FROM Leave_Request__c WHERE Id = :recordId
        ];
        System.assertEquals('Pending', saved.Status__c, 'New request should be Pending');
        System.assertEquals(3, saved.Leave_Duration__c, '10 Nov to 12 Nov should be 3 days');
        System.assertEquals(UserInfo.getUserId(), saved.Employee__c, 'Employee should be the creator');
    }

    @IsTest
    static void rejectsEndDateBeforeStartDate() {
        try {
            LeaveRequestController.createLeaveRequest(
                'Casual Leave', Date.newInstance(2026, 11, 12), Date.newInstance(2026, 11, 10), 'Test');
            System.assert(false, 'Expected an exception');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('End Date'), 'Unexpected message: ' + e.getMessage());
        }
    }

    @IsTest
    static void rejectsMissingRequiredValues() {
        try {
            LeaveRequestController.createLeaveRequest(null, null, null, null);
            System.assert(false, 'Expected an exception');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('required'), 'Unexpected message: ' + e.getMessage());
        }
    }

    @IsTest
    static void returnsLeaveRequests() {
        LeaveRequestController.createLeaveRequest(
            'Sick Leave', Date.newInstance(2026, 11, 5), Date.newInstance(2026, 11, 6), 'Fever');
        List<Leave_Request__c> result = LeaveRequestController.getLeaveRequests();
        System.assertEquals(1, result.size(), 'One request should be returned');
    }

    @IsTest
    static void submitFailsGracefullyWithoutProcess() {
        Id recordId = LeaveRequestController.createLeaveRequest(
            'Casual Leave', Date.newInstance(2026, 11, 10), Date.newInstance(2026, 11, 12), 'Test');
        try {
            LeaveRequestController.submitForApproval(recordId);
        } catch (AuraHandledException e) {
            System.assertNotEquals(null, e.getMessage(), 'Error message should be returned');
        }
    }
}
