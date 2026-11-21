# Mangosteen Cafe CRM — Discovery and Scope

**Project stage:** Step 1 — requirements discovery  
**Prepared for:** Mangosteen Cafe, Indore  
**Status:** Draft; client input required before design or development

## 1. Product goal

Build a premium, easy-to-use web CRM that helps Mangosteen Cafe:

- recognize and retain valuable customers;
- manage reservations and celebrations;
- operate a loyalty and rewards program;
- collect feedback and recover unhappy customers;
- run permission-based WhatsApp and email campaigns; and
- understand customer visits, spending, offers, and campaign performance.

The first release will be an internal web application for the cafe owner and staff, plus mobile-friendly customer pages for loyalty, reservations, and feedback.

## 2. Working assumptions to confirm

These assumptions let the team plan without pretending unknown details are settled.

| Assumption | Current answer | Client confirmation |
| --- | --- | --- |
| The CRM will initially serve one Mangosteen location | Assumed yes | Pending |
| Staff will access the CRM through a browser on desktop, tablet, or mobile | Assumed yes | Pending |
| Customers will not need to install a mobile app | Assumed yes | Pending |
| Customer identity will primarily use a mobile number | Assumed yes | Pending |
| WhatsApp is the primary customer communication channel | Assumed yes | Pending |
| Existing billing/POS data may not be directly accessible | Unknown | Pending |
| The first release will not replace billing, accounting, inventory, or kitchen systems | Assumed yes | Pending |
| English will be the staff interface language | Assumed yes | Pending |
| Customer-facing forms may need English and Hindi | Recommended | Pending |
| The cafe owns or can obtain access to its domain and Google Business Profile | Unknown | Pending |

## 3. Client discovery questions

### Business and people

1. Who is the final decision-maker and who will approve each milestone?
2. How many branches are operating now, and are more branches planned in the next 12 months?
3. How many staff members need access, and what are their roles?
4. What are the three biggest customer-management problems today?

### Existing workflow and data

5. Which billing/POS software does the cafe use? Obtain the product name, plan, vendor contact, and export/API options.
6. Where are customer names, phone numbers, birthdays, orders, and reservations stored today?
7. Approximately how many existing customer records are available, and can they be exported to CSV or Excel?
8. How are reservations, event bookings, cancellations, and no-shows handled today?
9. Does the cafe already use a loyalty program, coupons, memberships, or gift cards?
10. What customer complaints occur most often, and who resolves them?

### Communication and integrations

11. Is there an active WhatsApp Business number? Is it owned by the cafe?
12. Does the cafe have a Meta Business account and business verification?
13. Who owns and administers the Google Business Profile?
14. Which email address/domain should send customer emails?
15. Does the cafe accept reservations or orders through its website, Google, Zomato, Swiggy, Instagram, or phone calls?
16. Which of these sources must appear in the CRM at launch?

### Loyalty, campaigns, and reports

17. Should rewards be based on spending, number of visits, specific products, or a combination?
18. What membership tiers and rewards does the owner want?
19. Which campaigns are most important: birthdays, anniversaries, inactive customers, VIP events, weekday offers, or new menu items?
20. Which numbers does the owner want to review daily, weekly, and monthly?

### Brand, privacy, and operations

21. Collect the logo, brand colours, fonts, menu, food photographs, and any existing design guidelines.
22. Should staff use English only, or should the CRM support Hindi as well?
23. Who is allowed to export customer information or send campaigns?
24. How long should customer, reservation, campaign, and audit data be retained?
25. Who will handle staff onboarding and ongoing CRM administration after launch?

## 4. Proposed premium MVP

### Included in Release 1

1. **Secure staff access**
   - Owner, manager, host/reception, marketing, and cashier roles
   - Role-based permissions
   - Password reset, session management, and audit log

2. **Owner dashboard**
   - Today's reservations, birthdays, open complaints, and tasks
   - New and returning customers
   - Loyalty activity
   - Customer and campaign trends
   - Useful filters by date and customer segment

3. **Customer profiles**
   - Contact details, important dates, preferences, allergies, consent, and notes
   - Visit, order, reservation, reward, feedback, and communication history
   - Tags and automatic customer segments
   - Duplicate detection and CSV import/export

4. **Reservations and celebrations**
   - Create, confirm, seat, complete, cancel, and mark no-show
   - Guest count, preferred time, table, occasion, deposit, and special requests
   - Calendar and list views
   - Confirmation and reminder readiness

5. **Loyalty and rewards**
   - Points ledger with reasons for every adjustment
   - Tier rules, coupons, expiry, and redemption
   - QR-accessed mobile loyalty card
   - No customer app required

6. **Feedback and recovery**
   - QR feedback form
   - Rating, comments, visit details, and optional contact information
   - Low-rating alert and manager recovery task
   - Resolution notes and recovery coupon
   - Google review invitation for eligible customers without manipulating ratings

7. **Campaign foundations**
   - Consent-aware audience segments
   - Campaign drafts and approval status
   - Template management
   - Basic delivery and redemption reporting
   - Live WhatsApp/email sending only after accounts and approvals are ready

8. **Reports and administration**
   - Customer growth, retention, visit frequency, loyalty, feedback, and campaign reports
   - Branch and business settings
   - Data export, backups, and activity history

### Explicitly outside Release 1

- Full POS or billing replacement
- Inventory and recipe costing
- Accounting, GST filing, or payroll
- Kitchen display system
- Food delivery marketplace replacement
- Native Android or iOS customer app
- AI-generated automatic replies without staff approval
- Multi-branch consolidation unless the client confirms it is immediately required

These can be planned later as integrations or separate modules.

## 5. Main workflows to approve

### Reservation

Website/phone enquiry → reservation created → confirmation → reminder → seated/no-show → visit completed → feedback request → customer history updated

### Walk-in customer

Phone number/QR captured with consent → customer found or created → visit/order recorded → points awarded → receipt/loyalty balance shared

### Poor feedback

Low rating received → manager alerted → task assigned → customer contacted → recovery action recorded → case resolved → return visit tracked

### Retention campaign

Audience selected → consent checked → message approved → campaign sent → delivery and redemption recorded → campaign revenue/report reviewed

## 6. Initial customer segments

- New customer: first recorded visit
- Returning customer: two or more visits
- Regular: at least three visits in the last 60 days
- VIP: spending or visit threshold set by the owner
- At risk: no visit within the owner-defined period
- Birthday/anniversary upcoming
- Vegetarian/vegan or other preference-based groups
- Complaint unresolved
- Marketing opted in / opted out

Thresholds must remain configurable instead of being hard-coded.

## 7. Success measures

The client should select baseline values and targets for:

- repeat-visit rate;
- loyalty sign-ups per month;
- reservation no-show rate;
- feedback response rate;
- average complaint-resolution time;
- percentage of customers with valid marketing consent;
- birthday/inactive-customer campaign redemption; and
- campaign-attributed revenue.

## 8. Data and privacy requirements

- Collect only information needed for an explained business purpose.
- Store the source, time, purpose, and status of customer consent.
- Keep transactional communication consent separate from marketing consent.
- Make opt-out and consent withdrawal easy.
- Restrict customer exports and campaign sending by role.
- Keep an audit trail for sensitive changes.
- Encrypt connections and secrets; never place service credentials in frontend code.
- Define a retention and deletion process before production launch.
- Obtain client authorization before managing Google reviews or connected accounts.

## 9. Deliverables and approvals

| Milestone | Deliverable | Approval needed from |
| --- | --- | --- |
| 1. Discovery | Confirmed answers, MVP scope, success measures | Owner/decision-maker |
| 2. Product design | User flows, data model, wireframes, visual direction | Owner and operating manager |
| 3. Prototype | Clickable dashboard and core workflows | Owner and selected staff |
| 4. Development | Tested Release 1 application | Project representative |
| 5. Pilot | Real staff and limited real data | Owner/manager |
| 6. Production | Launch, training, backup and support handover | Owner |

## 10. Step 1 completion checklist

- [ ] Decision-maker and day-to-day contact identified
- [ ] Discovery questions answered
- [ ] Existing software and data exports inspected
- [ ] Staff roles confirmed
- [ ] Release 1 inclusions and exclusions approved
- [ ] Loyalty rules agreed
- [ ] Required integrations ranked
- [ ] Privacy and consent approach approved
- [ ] Success targets recorded
- [ ] Written scope approval received

Once these items are complete, proceed to **Step 2: information architecture, user roles, workflows, and database design**.
