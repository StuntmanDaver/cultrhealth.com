# Healthie Webhook Event Catalogue

**Source URL:** https://docs.gethealthie.com/guides/webhooks/event-reference/
**Backup URL:** https://docs.gethealthie.com/docs/webhooks
**Fetched:** 2026-05-01
**Sourced via:** `curl -sL` against the public docs site (Astro/Starlight HTML), event identifiers extracted from the rendered event reference page.

> Note on `diagnosis.create` vs `diagnosis.created`: The docs page shows both spellings. `diagnosis.create` appears 6 times in `<code>`/`<span>` spans on the reference page; `diagnosis.created` appears 2 times. We list both — Healthie should be queried to confirm which is the production-fired event before the Phase 8 dispatcher subscribes to either.

> CULTR action column legend:
> - `dispatch` — Phase 8 webhook dispatcher should route this event to a subscription/lifecycle handler.
> - `patient-sync` — should call `ensureHealthiePatient` / membership reconciliation.
> - `lab-sync` — should trigger SiPhox→Healthie lab document upload (`pushLabResultsToHealthie`).
> - blank — out of scope for v2.0; CULTR doesn't currently consume.

---

## Appointment events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `appointment.created` | appointment | New appointment scheduled | — | dispatch |
| `appointment.updated` | appointment | Appointment changed (time, type, provider, notes) | varies | dispatch |
| `appointment.deleted` | appointment | Appointment cancelled / removed | — | dispatch |
| `appointment.patient_added` | appointment | A patient was added to the appointment roster | — | |
| `appointment.patient_removed` | appointment | A patient was removed from the appointment roster | — | |
| `appointment.participant_joined` | appointment | A participant joined the appointment (telehealth session) | — | |
| `appointment.participant_left` | appointment | A participant left the appointment | — | |
| `appointment.recording_started` | appointment | Telehealth session recording started | — | |
| `appointment.recording_stopped` | appointment | Telehealth session recording stopped | — | |
| `appointment.recording_completed` | appointment | Recording finalized and available | — | |
| `appointment.transcript_available` | appointment | Transcript ready for the recorded appointment | — | |
| `appointment_form_answer_group_connection.created` | appointment_form_answer_group_connection | Form attached to an appointment | — | |
| `appointment_form_answer_group_connection.updated` | appointment_form_answer_group_connection | Linked form connection changed | — | |
| `appointment_form_answer_group_connection.deleted` | appointment_form_answer_group_connection | Form connection removed | — | |

## Availability events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `availability.created` | availability | Provider added new availability slot | — | |
| `availability.updated` | availability | Availability slot changed | — | |
| `availability.deleted` | availability | Availability slot removed | — | |

## Patient (User) events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `patient.created` | user/patient | New patient (client) created | — | patient-sync |
| `patient.updated` | user/patient | Patient demographics changed | varies | patient-sync |
| `patient.merged` | user/patient | Two patient records merged | — | patient-sync |

## Form / Form Answer Group events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `form_answer_group.created` | form_answer_group | New form answer set created | — | dispatch |
| `form_answer_group.deleted` | form_answer_group | Form answer set deleted | — | |
| `form_answer_group.signed` | form_answer_group | Form answer set signed by patient | — | dispatch |
| `form_answer_group.locked` | form_answer_group | Form answer set locked from edits | — | |
| `form_answer_group.unlocked` | form_answer_group | Form answer set unlocked for edits | — | |
| `generated_form_answer_group.created` | form_answer_group | Form answers auto-generated (e.g., AI scribe) | — | |
| `requested_form_completion.created` | requested_form_completion | Provider requested patient complete a form | — | |
| `requested_form_completion.updated` | requested_form_completion | Form-completion request status changed | — | |
| `requested_form_completion.deleted` | requested_form_completion | Form-completion request cancelled | — | |
| `custom_module_form.created` | custom_module_form | New form template created | — | |
| `custom_module_form.updated` | custom_module_form | Form template updated | — | |
| `custom_module_form.deleted` | custom_module_form | Form template deleted | — | |
| `custom_module.created` | custom_module | New form question/module created | — | |
| `custom_module.updated` | custom_module | Form question/module updated | — | |
| `custom_module.deleted` | custom_module | Form question/module deleted | — | |

## Document events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `document.created` | document | Document uploaded to a patient | — | dispatch |
| `document.updated` | document | Document metadata or contents changed | — | |
| `document.deleted` | document | Document deleted | — | |
| `folder_sharing.created` | folder_sharing | Document folder shared with another user | — | |
| `folder_sharing.deleted` | folder_sharing | Document folder share removed | — | |

## Conversation / Messaging events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `conversation.created` | conversation | New conversation thread started | — | |
| `conversation.updated` | conversation | Conversation thread updated | — | |
| `conversation_membership.created` | conversation_membership | Member added to a conversation | — | |
| `conversation_membership.deleted` | conversation_membership | Member removed from a conversation | — | |
| `conversation_membership.viewed` | conversation_membership | Member opened/read the conversation | — | |
| `message.created` | message | New message posted in a conversation | — | |
| `message.deleted` | message | Message deleted | — | |
| `scheduled_message.sent` | scheduled_message | Scheduled outbound message delivered | — | |

## Care plan / Goal events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `care_plan.created` | care_plan | New care plan created | — | |
| `care_plan.updated` | care_plan | Care plan changed | — | |
| `care_plan.activated` | care_plan | Care plan moved to active status | — | |
| `care_plan.deactivated` | care_plan | Care plan moved to inactive status | — | |
| `care_plan.deleted` | care_plan | Care plan deleted | — | |
| `goal.created` | goal | Patient goal created | — | |
| `goal.updated` | goal | Patient goal changed | — | |
| `goal.deleted` | goal | Patient goal removed | — | |
| `goal_history.created` | goal_history | Goal history entry created | — | |
| `goal_history.deleted` | goal_history | Goal history entry removed | — | |
| `goal_template.created` | goal_template | Goal template created | — | |
| `goal_template.updated` | goal_template | Goal template changed | — | |
| `goal_template.deleted` | goal_template | Goal template removed | — | |

## Metric / Tracking events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `metric_entry.created` | metric_entry | Patient logged a tracked metric (weight, mood, etc.) | — | |
| `metric_entry.updated` | metric_entry | Metric entry changed | — | |
| `metric_entry.deleted` | metric_entry | Metric entry removed | — | |
| `entry.created` | entry | Generic journal/entry created | — | |
| `entry.updated` | entry | Entry changed | — | |
| `entry.deleted` | entry | Entry removed | — | |

## Note / Charting events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `comment.created` | comment | Comment added to a chart/note | — | |
| `comment.updated` | comment | Comment edited | — | |
| `comment.deleted` | comment | Comment removed | — | |
| `charting_note_addendum.created` | charting_note_addendum | Addendum added to a chart note | — | |
| `charting_note_addendum.updated` | charting_note_addendum | Addendum edited | — | |
| `charting_note_addendum.deleted` | charting_note_addendum | Addendum removed | — | |
| `applied_tag.created` | applied_tag | Tag applied to a record | — | |
| `applied_tag.deleted` | applied_tag | Tag removed from a record | — | |
| `task.created` | task | Task created | — | |
| `task.updated` | task | Task changed (status, assignee, etc.) | — | |
| `task.deleted` | task | Task deleted | — | |

## Lab / Diagnostic events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `lab_order.created` | lab_order | Lab order created in Healthie | — | |
| `lab_order.updated` | lab_order | Lab order status/details changed | — | |
| `lab_result.created` | lab_result | Lab result received and attached | — | lab-sync |
| `lab_result.updated` | lab_result | Lab result modified | — | lab-sync |

## Diagnosis / Allergy / History events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `diagnosis.create` | diagnosis | Diagnosis recorded (per docs as `diagnosis.create`; verify against `diagnosis.created` before subscribing) | — | |
| `diagnosis.created` | diagnosis | Diagnosis recorded (alternate spelling per docs) | — | |
| `diagnosis.updated` | diagnosis | Diagnosis changed | — | |
| `diagnosis.deleted` | diagnosis | Diagnosis removed | — | |
| `allergy_sensitivity.created` | allergy_sensitivity | Allergy or sensitivity recorded | — | |
| `allergy_sensitivity.updated` | allergy_sensitivity | Allergy/sensitivity changed | — | |
| `allergy_sensitivity.deleted` | allergy_sensitivity | Allergy/sensitivity removed | — | |
| `family_history_condition.created` | family_history_condition | Family-history condition recorded | — | |
| `family_history_condition.updated` | family_history_condition | Family-history condition changed | — | |
| `family_history_condition.deleted` | family_history_condition | Family-history condition removed | — | |
| `medication.created` | medication | Medication added | — | |
| `medication.updated` | medication | Medication changed | — | |
| `medication.deleted` | medication | Medication discontinued | — | |
| `prescription.updated` | prescription | Prescription status/details changed (DoseSpot) | — | |
| `dosespot_notification.created` | dosespot_notification | DoseSpot notification received | — | |

## Insurance / Claims events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `accepted_insurance_plan.created` | accepted_insurance_plan | Practice added an accepted insurance plan | — | |
| `accepted_insurance_plan.deleted` | accepted_insurance_plan | Practice removed an accepted insurance plan | — | |
| `insurance_authorization.created` | insurance_authorization | Auth created for a plan | — | |
| `insurance_authorization.updated` | insurance_authorization | Authorization changed | — | |
| `insurance_authorization.deleted` | insurance_authorization | Authorization removed | — | |
| `policy.created` | policy | Patient insurance policy added | — | |
| `policy.updated` | policy | Insurance policy details changed | — | |
| `policy.deleted` | policy | Insurance policy removed | — | |
| `claim_submission.created` | claim_submission | Claim submitted to payer | — | |
| `claim_submission.updated` | claim_submission | Claim status/details changed | — | |
| `claim_submission.deleted` | claim_submission | Claim removed | — | |
| `cms1500.created` | cms1500 | CMS-1500 claim form created | — | |
| `cms1500.updated` | cms1500 | CMS-1500 form changed | — | |
| `cms1500.deleted` | cms1500 | CMS-1500 form removed | — | |
| `referral.created` | referral | Referral issued | — | |
| `referral.updated` | referral | Referral changed | — | |
| `referral.deleted` | referral | Referral removed | — | |
| `referring_physician.created` | referring_physician | Referring physician record added | — | |
| `referring_physician.updated` | referring_physician | Referring physician changed | — | |
| `referring_physician.deleted` | referring_physician | Referring physician removed | — | |
| `other_id_number.created` | other_id_number | Other identifier (NPI, etc.) added | — | |
| `other_id_number.updated` | other_id_number | Other identifier changed | — | |
| `other_id_number.deleted` | other_id_number | Other identifier removed | — | |

## Billing / Payment events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `payment.created` | payment | Payment captured | — | |
| `payment.updated` | payment | Payment status changed | — | |
| `payment.deleted` | payment | Payment removed | — | |
| `recurring_payment.created` | recurring_payment | Recurring billing record created | — | |
| `recurring_payment.updated` | recurring_payment | Recurring billing changed | — | |
| `requested_payment.created` | requested_payment | Payment request issued to patient | — | |
| `requested_payment.updated` | requested_payment | Payment request changed (e.g., paid) | — | |
| `requested_payment.deleted` | requested_payment | Payment request cancelled | — | |
| `billing_item.created` | billing_item | Billing line item added | — | |
| `billing_item.updated` | billing_item | Billing line item changed | — | |
| `billing_item.deleted` | billing_item | Billing line item removed | — | |
| `super_bill.created` | super_bill | Super-bill generated | — | |
| `super_bill.updated` | super_bill | Super-bill changed | — | |
| `super_bill.deleted` | super_bill | Super-bill removed | — | |
| `charge_back.created` | charge_back | Chargeback opened | — | |
| `charge_back.updated` | charge_back | Chargeback status changed | — | |
| `charge_back.deleted` | charge_back | Chargeback removed | — | |
| `stripe_customer_detail.created` | stripe_customer_detail | Stripe customer linked to patient | — | |
| `stripe_customer_detail.updated` | stripe_customer_detail | Stripe customer details changed | — | |
| `stripe_customer_detail.deleted` | stripe_customer_detail | Stripe customer link removed | — | |

## Course / Enrollment events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `course_membership.created` | course_membership | Patient enrolled in a course | — | |
| `course_membership.updated` | course_membership | Course enrollment changed | — | |
| `course_membership.deleted` | course_membership | Patient unenrolled from a course | — | |
| `completed_onboarding_item.created` | completed_onboarding_item | Patient completed an onboarding item | — | |
| `completed_onboarding_item.updated` | completed_onboarding_item | Onboarding item completion changed | — | |
| `completed_onboarding_item.deleted` | completed_onboarding_item | Onboarding item completion removed | — | |

## Organization / Location / Tag events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `organization_info.created` | organization_info | Organization info record created | — | |
| `organization_info.updated` | organization_info | Organization info changed | — | |
| `organization_info.deleted` | organization_info | Organization info removed | — | |
| `organization_member.updated` | organization_member | Organization member changed | — | |
| `organization_membership.created` | organization_membership | New org membership created | — | |
| `organization_membership.updated` | organization_membership | Org membership changed | — | |
| `location.created` | location | Practice location added | — | |
| `location.updated` | location | Practice location changed | — | |
| `location.deleted` | location | Practice location removed | — | |
| `feature_toggle.created` | feature_toggle | Feature flag created | — | |
| `feature_toggle.updated` | feature_toggle | Feature flag changed | — | |
| `feature_toggle.deleted` | feature_toggle | Feature flag removed | — | |

## Communication / Notification events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `notification_contact.created` | notification_contact | Notification contact added | — | |
| `notification_contact.updated` | notification_contact | Notification contact changed | — | |
| `notification_contact.deleted` | notification_contact | Notification contact removed | — | |
| `notification_setting.created` | notification_setting | Notification setting created | — | |
| `notification_setting.updated` | notification_setting | Notification setting changed | — | |
| `notification_setting.deleted` | notification_setting | Notification setting removed | — | |
| `sent_notification_record.created` | sent_notification_record | Outbound notification record created | — | |
| `sent_notification_record.updated` | sent_notification_record | Notification record updated (e.g., delivered) | — | |
| `received_fax.created` | received_fax | Inbound fax received | — | |
| `sent_fax.created` | sent_fax | Outbound fax queued | — | |
| `sent_fax.updated` | sent_fax | Outbound fax changed | — | |
| `sent_fax.status_changed` | sent_fax | Outbound fax delivery status changed | — | |

## External integration events

| event_type | resource_type | trigger | changed_fields | CULTR action |
|---|---|---|---|---|
| `external_calendar.authorization_error` | external_calendar | External calendar OAuth/connection failed | — | |

---

Total events: 171 (sourced from https://docs.gethealthie.com/guides/webhooks/event-reference/ on 2026-05-01).

Note: Healthie publishes webhook events publicly; the official sidebar nav at `/guides/webhooks/event-reference/` is the authoritative list. Refresh by re-fetching that URL and re-extracting `<code>`-tagged event identifiers; the page is rendered server-side via Astro/Starlight so a single curl is sufficient.
