/**
 * Server-side controller for the Leave Management LWCs.
 * Handles creating, listing and submitting Leave_Request__c records.
 */
public with sharing class LeaveRequestController {

    /** Creates a Pending leave request for the logged-in user and returns its Id. */
    @AuraEnabled
    public static Id createLeaveRequest(String leaveType, Date startDate, Date endDate, String reason) {
        if (String.isBlank(leaveType) || startDate == null || endDate == null) {
            throw buildException('Leave type, start date and end date are required.');
        }
        if (endDate < startDate) {
            throw buildException('End Date must be greater than or equal to Start Date.');
        }

        Leave_Request__c request = new Leave_Request__c(
            Leave_Type__c = leaveType,
            Start_Date__c = startDate,
            End_Date__c = endDate,
            Reason__c = reason,
            Status__c = 'Pending',
            Employee__c = UserInfo.getUserId()
        );

        try {
            insert as user request;
        } catch (DmlException e) {
            throw buildException(e.getDmlMessage(0));
        }
        return request.Id;
    }

    /** Returns all leave requests visible to the user, newest first. */
    @AuraEnabled(cacheable=true)
    public static List<Leave_Request__c> getLeaveRequests() {
        return [
            SELECT Id, Name, Leave_Type__c, Start_Date__c, End_Date__c,
                   Leave_Duration__c, Reason__c, Status__c, Manager_Comments__c
            FROM Leave_Request__c
            WITH USER_MODE
            ORDER BY CreatedDate DESC
            LIMIT 200
        ];
    }

    /** Submits a leave request into the Leave_Requests_Approval process. */
    @AuraEnabled
    public static void submitForApproval(Id recordId) {
        try {
            Approval.ProcessSubmitRequest req = new Approval.ProcessSubmitRequest();
            req.setObjectId(recordId);
            req.setSubmitterId(UserInfo.getUserId());
            req.setComments('Submitted from Leave Management app');
            Approval.process(req);
        } catch (Exception e) {
            throw buildException(e.getMessage());
        }
    }

    private static AuraHandledException buildException(String message) {
        AuraHandledException ex = new AuraHandledException(message);
        ex.setMessage(message);
        return ex;
    }
}
