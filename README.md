# Employee Leave Management System (Salesforce)

Wipro Salesforce Training Program – Phase II Mini Project (Q3).

An application where employees submit leave requests and a manager approves or rejects them with comments. Built with Lightning Web Components, JavaScript, Apex and a custom object, plus an Approval Process and email notifications.

## Features
- Leave request form (leave type, start date, end date, reason) with live duration calculation
- Date validation in JavaScript, Apex and a validation rule
- Requests stored in the `Leave_Request__c` custom object
- Request list with status filter, search and per-status counts
- Submit a request for approval from the form or from the list
- Approval Process with manager comments, record lock and email alerts (Approved / Rejected)

## Project structure
```
force-app/main/default/
  classes/   LeaveRequestController, LeaveRequestControllerTest
  lwc/       leaveManagement (container), leaveRequestForm, leaveRequestList
  objects/   Leave_Request__c (fields, validation rule)

<img width="1598" height="740" alt="WhatsApp Image 2026-11-15 at 1 00 08 AM" src="https://github.com/user-attachments/assets/13dc8d58-2c73-4398-9133-b38212343cb1" />

<img width="1600" height="899" alt="WhatsApp Image 2026-11-15 at 1 00 19 AM" src="https://github.com/user-attachments/assets/63f54a3c-35c3-4401-9b75-1d098f425a80" />

<img width="1600" height="742" alt="WhatsApp Image 2026-11-15 at 1 00 41 AM (1)" src="https://github.com/user-attachments/assets/a346cc9e-fb3c-440e-99fb-97e1dda9d5d0" />


```

## Data model: Leave_Request__c
| Field | Type |
|---|---|
| Leave Request Number (Name) | Auto Number `LR-{0000}` |
| Leave_Type__c | Picklist |
| Start_Date__c / End_Date__c | Date |
| Leave_Duration__c | Formula: End − Start + 1 |
| Reason__c, Manager_Comments__c | Long Text Area |
| Status__c | Picklist (Pending, Approved, Rejected) |
| Employee__c, Manager__c | Lookup(User) |

## Configured in Setup (not in this repo)
- Approval Process `Leave_Requests_Approval` (entry criteria Status = Pending, record lock)
- Email Templates: Leave Approved Template, Leave Rejected Template
- Email Alerts: Leave Request Approved, Leave Request Rejected (recipient: Record Creator)
- Final Approval / Rejection actions send the alerts

## Setup
```
sf org login web
sf project deploy start --source-dir force-app
sf apex run test --class-names LeaveRequestControllerTest --result-format human
```
Then add the **Leave Management** component to a Lightning App Page.

## Test cases
| ID | Action | Expected |
|---|---|---|
| T1 | Submit request | Status = Pending |
| T2 | Manager approves | Status = Approved |
| T3 | Manager rejects | Status = Rejected |
| T4 | End date before start date | Validation error |
| T5 | 10 Nov to 12 Nov | Duration = 3 days |
| T6 | Approve / Reject | Email notification received |

Only synthetic demo data is used. No credentials or secrets are stored in this repository.
