# Siphox API — Endpoint Reference

> Auto-generated from `references/openapi.json` (Siphox API v1.0.0).
> Base URL: `https://connect.siphoxhealth.com`
> Auth header: `Authorization: Token <TOKEN>` (note: literal word `Token`, not `Bearer`).

## Endpoint index

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/create-order` | Create a new order. You can use our Zapier integration to connect order creation directly with your store. |
| GET | `/api/v1/customers/{id}/reports/{reportID}` | Get customer report |
| GET | `/api/v1/customers/{id}` | Get customer details |
| GET | `/api/v1/customers` | Get all customers |
| GET | `/api/v1/kits` | Get business kits |
| GET | `/api/v1/kits/{kitID}/validate` | Validate if a kit ID exists for the authenticated business |
| POST | `/api/v1/kits/{kitID}/register` | Register a kit for a customer |
| GET | `/api/v1/credits` | Get business credits info |
| GET | `/api/v1/biomarkers` | Get list of all available biomarkers |
| POST | `/api/v1/customer` | Create a new B2B customer |
| POST | `/api/v1/customer/add-data` | Add data for a B2B customer (quiz, test results, or file). For large file processing, you can request asynchronous proce |
| GET | `/api/v1/customer/add-data/jobs/{id}` | Check status of an extract markers job |
| GET | `/api/v1/orders/{id}` | Get a specific order by ID |
| GET | `/api/v1/orders` | List all orders with optional filtering |
| POST | `/api/v1/sai/chats` | Create a new AI chat conversation |
| GET | `/api/v1/sai/chats` | List conversations with optional filters |
| POST | `/api/v1/sai/chats/{chatId}/messages` | Send a message to an existing conversation |
| PATCH | `/api/v1/sai/chats/{chatId}` | Update conversation metadata (tags and notes) |
| DELETE | `/api/v1/sai/chats/{chatId}` | Delete a conversation |
| POST | `/api/v1/sai/chats/{userId}` | Send a chat message (creates new conversation if no chatId provided) |
| GET | `/api/v1/sai/settings` | Get SAI settings for the business |
| PATCH | `/api/v1/sai/settings` | Update SAI settings for the business |
| GET | `/api/v1/sai/upsells` | Get product offerings JSON string for the business |
| POST | `/api/v1/sai/upsells` | Update product offerings for the business |

---

## POST /api/v1/create-order

**Summary.** Create a new order. You can use our Zapier integration to connect order creation directly with your store.

### Request body

`application/json` (required: yes)

`CreateOrderRequest` (see Schemas)

### Responses

**200** — Payment link generated or charged successfully

oneOf:
  -     - `link`: string

**201** — Order created successfully

oneOf:
  -     - `orderId`: string
  -     - `orderIds`: array

**400** — Bad request (e.g. invalid kit type or multiple kit types without enough credits)

**409** — Conflict (e.g. not enough credits, payment method missing, or purchasing disabled)

---

## GET /api/v1/customers/{id}/reports/{reportID}

**Summary.** Get customer report

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | yes | string | customer internal/external id |
| `reportID` | path | yes | string |  |

### Responses

**200** — Customer report retrieved successfully

- `axes`: array
    - `axis`: string
    - `category`: string
    - `result`: number
    - `historic`: array
          - `result`: number
          - `timestamp`: string (date-time)
          - `reportType`: string
          - `kitType`: string
          - `spotID`: string
    - `range`: string
    - `usersAverage`: number
    - `description`: string
    - `infoLink`: string
- `biomarker`: array
    - `simpleLabel`: string
    - `ranges`: object
          - `optimal`: array
          - `inRange`: array
          - `good`: array
          - `fair`: array
    - `result`: number
    - `rawResult`: number
    - `type`: string
    - `unit`: string
    - `label`: string
    - `shortLabel`: string
    - `targetType`: string
    - `nonUpperRanged`: boolean
    - `nonNumerical`: boolean
    - `infoLink`: string
    - `category`: object
          - `name`: string
          - `weight`: number
    - `deviationScore`: number
    - `historic`: array
          - `result`: number
          - `rawResult`: number
          - `timestamp`: string (date-time)
          - `ranges`: object
                  - `optimal`: array
                  - `inRange`: array
                  - `good`: array
                  - `fair`: array
          - `reportType`: string
          - `kitType`: string
          - `spotID`: string
    - `state`: string
    - `labRange`: string
    - `siphoxRange`: string
    - `commonAlternativeUnits`: array
    - `conversionEnabled`: boolean
- `wearable`: array
- `suggestions`: array
- `actionsState`: array
- `details`: object
    - `collectedDate`: string (date-time)
    - `resultedDate`: string (date-time)
- `labParamsError`: array — Lab parameter errors detected for this report

**404** — Report not found

---

## GET /api/v1/customers/{id}

**Summary.** Get customer details

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | yes | string |  |

### Responses

**200** — Customer details retrieved successfully

- `id`: string
- `name`: string
- `email`: string
- `reports`: array
    - `id`: string
    - `collectedDate`: string (date-time)
    - `resultedDate`: string (date-time)
    - `status`: string
    - `vendorStatus`: string

**404** — Customer not found

---

## GET /api/v1/customers

**Summary.** Get all customers

### Responses

**200** — List of customers retrieved successfully

array of - `id`: string
- `name`: string
- `email`: string
- `reports`: array

---

## GET /api/v1/kits

**Summary.** Get business kits

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `page` | query | yes | integer | Page number for pagination |
| `size` | query | yes | integer | Number of items per page (max 250) |
| `kitID` | query | no | string | Filter by kit IDs, join multiple IDs with a comma (limit 50 IDs per request) |
| `orderID` | query | no | string | Filter by order IDs, join multiple IDs with a comma (limit 50 IDs per request) |
| `externalID` | query | no | string | Filter by external ID |
| `includeShipmentTracking` | query | no | integer (0|1) | Include shipment tracking information (0 or 1) |

### Responses

**200** — List of business kits retrieved successfully

array of - `kitID`: string
- `orderID`: string
- `recipientEmail`: string
- `registeredToEmail`: string
- `lastUpdatedDate`: string (date-time)
- `createdDate`: string (date-time)
- `kitStatus`: string
- `sampleStatus`: string
- `status`: string
- `shipment`: object
    - `toUser`: object
          - `trackingNumber`: string
          - `carrier`: string
          - `date`: string (date-time)
    - `toLab`: object
          - `trackingNumber`: string
          - `carrier`: string
          - `date`: string (date-time)

---

## GET /api/v1/kits/{kitID}/validate

**Summary.** Validate if a kit ID exists for the authenticated business

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `kitID` | path | yes | string | The kit ID to validate |

### Responses

**200** — Kit validation result

oneOf:
  -     - `exists`: boolean
    - `kitID`: string
    - `businessKey`: string
    - `kitStatus`: string
    - `sampleStatus`: string
  -     - `exists`: boolean
    - `kitID`: string

**400** — Invalid request - kitID is required

- `error`: string

**401** — Unauthorized - Invalid or missing API token

**500** — Internal server error

- `code`: string
- `message`: string

---

## POST /api/v1/kits/{kitID}/register

**Summary.** Register a kit for a customer

Registers a kit to a customer. If the customer does not exist, one is created automatically.
Registration triggers asynchronous lab processing — the response confirms initiation, not completion.

**Note:** This endpoint is temporarily disabled and returns 503. It will be enabled in a future release.

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `kitID` | path | yes | string | The kit ID to register |

### Request body

`application/json` (required: yes)

- `firstName`: string **(required)** — Customer's first name
- `lastName`: string **(required)** — Customer's last name
- `email`: string **(required)** — Customer's email address (email)
- `dateOfBirth`: string **(required)** — Date of birth (YYYY-MM-DD)
- `sex`: string **(required)** — Biological sex (M or F) (`M` | `F`)
- `phone`: string — Phone number (required for EasyDraw kits to receive SMS instructions)
- `addressLine1`: string — Street address line 1
- `addressLine2`: string — Street address line 2
- `city`: string
- `state`: string
- `zip`: string
- `country`: string
- `race`: array — Optional race/ethnicity identifiers
- `consentForResearch`: boolean — Whether the customer consents to research use of their data

### Responses

**200** — Kit registration initiated successfully

- `message`: string
- `kitID`: string
- `customerId`: string

**400** — Validation failed

- `error`: string
- `details`: array

**404** — Kit not found or does not belong to this business

- `error`: string

**409** — Kit has already been registered

- `error`: string

**500** — Internal server error

- `code`: string
- `message`: string

**503** — Endpoint not yet available

- `error`: string
- `code`: string

---

## GET /api/v1/credits

**Summary.** Get business credits info

### Responses

**200** — Business credits info retrieved successfully

---

## GET /api/v1/biomarkers

**Summary.** Get list of all available biomarkers

### Responses

**200** — List of biomarkers retrieved successfully

array of - `id`: string — Unique identifier for the biomarker
- `label`: string — Full label for the biomarker
- `shortLabel`: string — Short label for the biomarker
- `simpleLabel`: string — Simple label for the biomarker
- `type`: string — Type of the biomarker
- `unknown`: boolean — Whether the biomarker is unknown
- `unit`: string — Unit of measurement for the biomarker
- `gender`: string — Gender specification if applicable
- `category`: string — Category the biomarker belongs to

**500** — Internal server error

- `code`: string
- `message`: string

---

## POST /api/v1/customer

**Summary.** Create a new B2B customer

### Request body

`application/json` (required: yes)

- `email`: string **(required)** — Valid email address for the customer (email)
- `name`: string **(required)** — Name of the customer
- `customTags`: array — Optional custom tags for the customer
- `dateOfBirth`: string **(required)** — Date of birth in YYYY-MM-DD format (date)
- `gender`: string **(required)** — Gender (M for male, F for female) (`M` | `F`)

**Example:**
```json
{
  "email": "john.doe@example.com",
  "name": "John Doe",
  "customTags": [
    "vip",
    "enterprise"
  ],
  "dateOfBirth": "1990-01-01",
  "gender": "M"
}
```

### Responses

**201** — Customer created successfully

- `id`: string
- `email`: string
- `name`: string
- `businessKey`: string
- `authType`: string
- `customTags`: array
- `dateOfBirth`: string (date)
- `gender`: string (`M` | `F`)

**400** — Validation failed

- `error`: string
- `details`: array
    - `message`: string

**401** — Business session is required

- `error`: string

**409** — Customer with this email already exists

- `error`: string

**500** — Internal server error

---

## POST /api/v1/customer/add-data

**Summary.** Add data for a B2B customer (quiz, test results, or file). For large file processing, you can request asynchronous processing.

### Request body

`application/json` (required: yes)

oneOf:
  -     - `type`: string **(required)** — Type of data being added (`quiz`)
    - `userId`: string **(required)** — ID of the customer to add data for
    - `quizName`: string **(required)** — Identifier for the quiz
    - `date`: string **(required)** — Date when the quiz was taken (ISO 8601 format) (date-time)
    - `quizData`: array **(required)**
            - `question`: string **(required)** — The question
            - `answer`: string **(required)** — Customer's answer to the question
  -     - `type`: string **(required)** — Type of data being added (`test`)
    - `userId`: string **(required)** — ID of the customer to add data for
    - `date`: string **(required)** — Date when the test was taken (ISO 8601 format) (date-time)
    - `biomarkerData`: array **(required)**
            - `name`: string **(required)** — Name of the biomarker
            - `result`: object **(required)** — Test result value
            - `unit_of_measure`: string **(required)** — Unit of measurement
            - `simpleLabel`: string — Simple label for the biomarker
            - `range_minimum`: number — Minimum range value
            - `range_maximum`: number — Maximum range value
            - `failedToConvert`: boolean — Whether the conversion failed
  -     - `type`: string **(required)** — Type of data being added (`file`)
    - `userId`: string **(required)** — ID of the customer to add data for
    - `date`: string **(required)** — Date when the uploaded test was taken (ISO 8601 format) (date-time)
    - `fileBlob`: string — Data URI string with base64 content (e.g., "data:application/pdf;base64,JVBER..."). Provide either fileBlob or s3FileUrl
    - `s3FileUrl`: string — URL to S3 file (provide either fileBlob or s3FileUrl, not both) (uri)
    - `async`: boolean — If true, process asynchronously. Returns 202 with jobId. Poll GET /api/v1/customer/add-data/jobs/{id}.

### Responses

**201** — Data added successfully

- `success`: boolean
- `message`: string

**202** — Accepted for asynchronous processing (file uploads only when async=true)

- `jobId`: string
- `status`: string (`pending` | `processing`)

**400** — Validation failed

- `error`: string
- `details`: array
    - `message`: string

**401** — Business session is required

- `error`: string

**403** — User does not belong to this business or feature is not enabled

- `error`: string

**404** — Customer not found

- `error`: string

**500** — Internal server error

---

## GET /api/v1/customer/add-data/jobs/{id}

**Summary.** Check status of an extract markers job

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | yes | string | Job ID returned by the async add-data request |

### Responses

**200** — Job status or completed result

oneOf:
  -     - `id`: string
    - `status`: string (`pending` | `processing` | `failed`)
    - `error`: string
  -     - `id`: string
    - `status`: string (`completed`)
    - `result`: object — Same payload as synchronous file add-data response
            - `type`: string
            - `userId`: string
            - `dataId`: string
            - `docId`: string
            - `reports`: array
            - `totalBiomarkers`: number
            - `timestamp`: string (date-time)

**401** — Business session is required

**404** — Job not found

---

## GET /api/v1/orders/{id}

**Summary.** Get a specific order by ID

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | yes | string | Order ID (spotID from business-orders collection) |

### Responses

**200** — Order retrieved successfully

- `orderID`: string — Unique order identifier
- `createdDate`: string — Order creation date (ISO 8601 format) (date-time)
- `status`: string — Order status
- `orderStatus`: string — Fulfillment order status - possible values: pending, preparing, in_progress, scheduled, needs_review, completed, cancele
- `sku`: string — Product SKU
- `quantity`: number — Number of kits in the order
- `recipientEmail`: string (email)
- `recipientName`: string
- `recipientPhone`: string
- `recipientAddress`: object
    - `street1`: string
    - `street2`: string
    - `city`: string
    - `state`: string
    - `zip`: string
    - `country`: string
- `externalID`: string — External customer/order identifier (Optional - only present if set during order creation)
- `externalTags`: array — External tags for categorization (Optional - only present if set during order creation)
- `registeredTo`: object — Information about the customer who registered the kit (Optional - only present if kit has been registered by an end user
    - `email`: string (email)
    - `customerID`: string — Internal customer ID
- `kits`: array — List of kits associated with this order
    - `kitID`: string
    - `kitStatus`: string — Kit status - possible values: preparing, inTransit, delivered, registered, collected, deliveryException, registrationExc
    - `sampleStatus`: string — Sample status - possible values: awaitingCollection, inTransit, collected, received, delivered, rejected, resulted, part
    - `registeredToEmail`: string — Email of customer who registered this kit (Optional - only present if kit is registered) (email)
    - `lastUpdatedDate`: string — Last status update timestamp (Optional) (date-time)

**401** — Business session is required

**404** — Order not found

**500** — Internal server error

---

## GET /api/v1/orders

**Summary.** List all orders with optional filtering

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `kitStatus` | query | no | string (preparing|inTransit|delivered|registered|collected|deliveryException|registrationException|canceled) | Filter by kit status |
| `sampleStatus` | query | no | string (awaitingCollection|inTransit|collected|received|delivered|rejected|resulted|partiallyResulted|collectionException|deliveryException|canceled) | Filter by sample status |
| `orderDateStart` | query | no | string | Filter orders created on or after this date (ISO 8601 format - YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD) |
| `orderDateEnd` | query | no | string | Filter orders created on or before this date (ISO 8601 format) |
| `registrationDateStart` | query | no | string | Filter orders with kits registered on or after this date (ISO 8601 format) |
| `registrationDateEnd` | query | no | string | Filter orders with kits registered on or before this date (ISO 8601 format) |
| `registeredTo` | query | no | string | Filter by customer email or customer ID |
| `sku` | query | no | string | Filter by product SKU |
| `page` | query | no | integer | Page number for pagination (0-based) |
| `size` | query | no | integer | Number of items per page (max 250) |

### Responses

**200** — List of orders retrieved successfully with pagination metadata

- `data`: array — Array of order objects
    - `orderID`: string
    - `createdDate`: string (date-time)
    - `status`: string
    - `orderStatus`: string
    - `sku`: string
    - `quantity`: number
    - `recipientEmail`: string (email)
    - `recipientName`: string
    - `recipientPhone`: string
    - `recipientAddress`: object
          - `street1`: string
          - `street2`: string
          - `city`: string
          - `state`: string
          - `zip`: string
          - `country`: string
    - `externalID`: string — External customer/order identifier (Optional)
    - `externalTags`: array — External tags for categorization (Optional)
    - `registeredTo`: object — Customer registration info (Optional)
          - `email`: string (email)
          - `customerID`: string
    - `kits`: array
          - `kitID`: string
          - `kitStatus`: string
          - `sampleStatus`: string
          - `registeredToEmail`: string — Email of customer who registered this kit (Optional) (email)
          - `lastUpdatedDate`: string — Last status update timestamp (Optional) (date-time)
- `pagination`: object — Pagination metadata
    - `page`: number — Current page number (0-based)
    - `size`: number — Number of items per page
    - `total`: number — Total number of orders matching the filters
    - `totalPages`: number — Total number of pages available
    - `hasNext`: boolean — Whether there are more pages after the current one
    - `hasPrevious`: boolean — Whether there are pages before the current one

**400** — Validation failed

**401** — Business session is required

**500** — Internal server error

---

## POST /api/v1/sai/chats

**Summary.** Create a new AI chat conversation

### Request body

`application/json` (required: yes)

- `userId`: string **(required)** — ID of the user to create conversation for
- `initialMessage`: string **(required)** — The initial message to start the conversation
- `customInstructions`: string — Optional custom instructions for the AI in this conversation

**Example:**
```json
{
  "userId": "64fa1df97cf8d322cfa492eb",
  "initialMessage": "What do my recent test results mean?",
  "customInstructions": "Focus on preventive health measures and lifestyle improvements"
}
```

### Responses

**201** — Conversation created successfully

- `chatId`: string — Unique identifier for the conversation
- `chats`: array
    - `content`: string
    - `createdAt`: string (date-time)
    - `source`: string (`user` | `siphox-ai-assistant`)

**400** — Validation failed

- `error`: string
- `details`: array

**401** — Business session is required

- `error`: string

**403** — User does not belong to this business

- `error`: string

**404** — User not found

- `error`: string

**500** — Internal server error

- `code`: string
- `message`: string

---

## GET /api/v1/sai/chats

**Summary.** List conversations with optional filters

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `userId` | query | no | string | Filter by user ID |
| `tags` | query | no | string | Comma-separated list of tags to filter by |
| `page` | query | no | string | Page number for pagination (default 1) |
| `limit` | query | no | string | Number of conversations per page (default 50) |

### Responses

**200** — List of conversations retrieved successfully

- `conversations`: array
    - `chatId`: string — Unique conversation identifier
    - `userId`: string — User ID for the conversation
    - `messageCount`: integer — Total number of messages
    - `firstMessage`: object
          - `content`: string
          - `createdAt`: string (date-time)
    - `lastMessage`: object
          - `content`: string
          - `createdAt`: string (date-time)
    - `createdAt`: string (date-time)
    - `updatedAt`: string (date-time)
    - `tags`: array
    - `notes`: array
    - `customInstructions`: string
- `pagination`: object
    - `page`: integer
    - `limit`: integer
    - `total`: integer
    - `totalPages`: integer

**400** — Validation failed

**401** — Business session is required

**500** — Internal server error

---

## POST /api/v1/sai/chats/{chatId}/messages

**Summary.** Send a message to an existing conversation

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `chatId` | path | yes | string | The conversation ID |

### Request body

`application/json` (required: yes)

- `message`: string **(required)** — The message to send to the AI

**Example:**
```json
{
  "message": "Can you explain my cholesterol levels in more detail?"
}
```

### Responses

**200** — Message sent successfully

- `chatId`: string
- `chats`: array
    - `content`: string
    - `createdAt`: string (date-time)
    - `source`: string (`user` | `siphox-ai-assistant`)

**400** — Validation failed

- `error`: string
- `details`: array

**401** — Business session is required

**403** — Conversation does not belong to this business

- `error`: string

**404** — Conversation not found

- `error`: string

**500** — Internal server error

- `code`: string
- `message`: string

---

## PATCH /api/v1/sai/chats/{chatId}

**Summary.** Update conversation metadata (tags and notes)

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `chatId` | path | yes | string | The conversation ID to update |

### Request body

`application/json` (required: yes)

- `tags`: array — Array of tags to assign to the conversation
- `notes`: string — Note to add to the conversation

**Example:**
```json
{
  "tags": [
    "follow-up",
    "cholesterol",
    "important"
  ],
  "notes": "Patient expressed concern about family history of heart disease"
}
```

### Responses

**200** — Conversation updated successfully

- `chatId`: string
- `message`: string
- `tags`: array
- `notes`: array

**400** — Validation failed

**401** — Business session is required

**403** — Conversation does not belong to this business

**404** — Conversation not found

**500** — Internal server error

---

## DELETE /api/v1/sai/chats/{chatId}

**Summary.** Delete a conversation

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `chatId` | path | yes | string | The conversation ID to delete |

### Responses

**200** — Conversation deleted successfully

- `chatId`: string — The deleted conversation ID
- `message`: string — Success message

**401** — Business session is required

- `error`: string

**403** — Conversation does not belong to this business

- `error`: string

**404** — Conversation not found

- `error`: string

**500** — Internal server error

- `code`: string
- `message`: string

---

## POST /api/v1/sai/chats/{userId}

**Summary.** Send a chat message (creates new conversation if no chatId provided)

Consolidated endpoint for chat operations. Creates a new conversation if no chatId is provided,
or continues an existing conversation if chatId is included in the request body.

**Chat Response Structure:**
The `saiResponse` field contains a JSON string with the following structure:
```json
{
  "chats": ["content": {"sections": [
    {
      "type": "PARAGRAPH",
      "content": "Text content here..."
    },
    {
      "type": "RESULTS_READ_OUT",
      "content": [
        {
          "name": "Cholesterol",
          "value": 180,
          "unit": "mg/dL"
        }
      ]
    }
  ],
  "productInfo": [
    {
      "id": "PRODUCT_ID",
      "name": "Product Name",
      "productURL": "https://example.com/product",
      "imageUrl": "https://example.com/image.jpg",
      "description": "Product description"
    }
  ],
  "getSupport": ["Get Support"],
  "followUpQuestions": [
    "How can I improve my cholesterol levels?",
    "What dietary changes are recommended?"
  ]
}]}
```

**Section Types:**
- `PARAGRAPH`: Regular text content
- `RESULTS_READ_OUT`: Biomarker results array with name, value, and unit

**Optional Fields:**
- `productInfo`: Array of product recommendations
- `getSupport`: Support options array
- `followUpQuestions`: Suggested follow-up questions

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `userId` | path | yes | string | The user ID to send the message for |

### Request body

`application/json` (required: yes)

- `chatId`: string — Optional conversation ID. If provided, continues existing conversation. If omitted, creates new conversation.
- `userMessage`: string **(required)** — The message to send to the AI
- `customInstructions`: string — Optional custom instructions for new conversations (ignored if chatId is provided)

### Responses

**200** — Message sent successfully

- `userMessage`: string — The user's message that was sent
- `saiResponse`: string — The AI's response as a JSON string containing chat sections
- `createdAt`: string — Timestamp when the message was processed (date-time)
- `chatId`: string — The conversation ID (newly created or existing)

**400** — Validation failed

- `error`: string
- `details`: array

**401** — Business session is required

- `error`: string

**403** — User does not belong to this business or conversation does not belong to this business

- `error`: string

**404** — User not found or conversation not found (when chatId is provided)

- `error`: string

**500** — Internal server error

- `code`: string
- `message`: string

---

## GET /api/v1/sai/settings

**Summary.** Get SAI settings for the business

### Responses

**200** — SAI settings retrieved successfully

- `preferredLanguage`: string — Preferred language for SAI responses
- `customInstructions`: string — Custom instructions for SAI behavior
- `upsellInstructions`: string — Instructions for upselling behavior
- `customSources`: array
    - `id`: string — Unique identifier for the source
    - `type`: string — Type of custom source (`reference` | `product`)
    - `description`: string — Description of the source
    - `sourceURL`: string — URL for the source (uri)
    - `sourceGetEndpoint`: string — API endpoint for retrieving source data

**404** — SAI settings not found

**500** — Internal server error

---

## PATCH /api/v1/sai/settings

**Summary.** Update SAI settings for the business

### Request body

`application/json` (required: yes)

- `preferredLanguage`: string **(required)** — Preferred language for SAI responses
- `customInstructions`: string **(required)** — Custom instructions for SAI behavior
- `upsellInstructions`: string — Instructions for upselling behavior (optional)

**Example:**
```json
{
  "preferredLanguage": "en",
  "customInstructions": "Focus on preventive health measures and lifestyle improvements",
  "upsellInstructions": "Recommend supplements based on biomarker deficiencies"
}
```

### Responses

**200** — SAI settings updated successfully

**400** — Validation failed

- `error`: string
- `details`: array
    - `message`: string

**401** — Business session is required

- `error`: string

**404** — Business customization not found

- `error`: string

**500** — Internal server error

- `code`: string
- `message`: string

---

## GET /api/v1/sai/upsells

**Summary.** Get product offerings JSON string for the business

### Responses

**200** — Product offerings JSON string retrieved successfully

string

**500** — Internal server error

- `code`: string
- `message`: string

---

## POST /api/v1/sai/upsells

**Summary.** Update product offerings for the business

### Request body

`application/json` (required: yes)

- `productOfferingsJson`: string **(required)** — JSON string containing array of product offerings. Send empty string or empty array to delete.

**Example:**
```json
{
  "productOfferingsJson": "[{\"id\":\"prod-123\",\"name\":\"Vitamin D3\",\"longDescription\":\"High-quality vitamin D3 supplement for bone health\",\"shortDescription\":\"Bone health supplement\",\"keywords\":[\"vitamin\",\"health\",\"bones\"],\"imageUrl\":\"https://example.com/image.jpg\",\"productUrl\":\"https://shop.example.com/vitamin-d3\",\"biomarkers\":[\"vitamin_d\"]}]"
}
```

### Responses

**200** — Product offerings updated successfully

- `message`: string
- `count`: number

**400** — Validation failed or invalid JSON

oneOf:
  -     - `error`: string
    - `details`: array
  -     - `error`: string
    - `message`: string
  -     - `error`: string
    - `message`: string
    - `details`: array

**401** — Business key not found

- `error`: string

**500** — Internal server error

- `code`: string
- `message`: string

---

