# Brand Questionnaire System Documentation

## Overview

The Brand Questionnaire System is a configurable, flexible solution for collecting brand-related information from workspace users. It supports dynamic question management, ordering, mandatory field validation, and integrates seamlessly with workspace setup completion.

## Key Features

### 🎯 **Core Functionality**
- **Configurable Questions**: Create, update, delete, and reorder questions
- **Question Types**: Support for text, textarea, select, radio, checkbox, URL, email, number, date, and file upload
- **Mandatory Questions**: Mark questions as required for workspace completion
- **Dynamic Ordering**: Reorder questions with drag-and-drop or numeric ordering
- **Conditional Logic**: Show/hide questions based on previous answers
- **Validation Rules**: Custom validation for each question type
- **Progress Tracking**: Real-time completion status and progress indicators

### 🔄 **Integration Features**
- **Workspace Integration**: Seamlessly integrated with workspace setup status
- **Completion Validation**: Prevents workspace completion without mandatory questions
- **Progress Calculation**: Overall workspace setup progress including questionnaire
- **Audit Trail**: Full tracking of who created, updated, and answered questions

## Database Schema

### BrandQuestion Entity

```typescript
@Entity('brand_questions')
export class BrandQuestion {
  id: string;                    // UUID primary key
  questionText: string;          // The actual question text
  description?: string;          // Optional description/help text
  questionType: QuestionType;    // Type of question (text, select, etc.)
  options?: string[];           // Options for select/radio/checkbox
  validationRules?: object;     // Custom validation rules
  displayOrder: number;         // Order of display (0-based)
  isMandatory: boolean;         // Whether question is required
  isActive: boolean;           // Whether question is active
  helpText?: string;           // Additional help text
  conditionalLogic?: object;   // Logic for conditional display
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

### BrandQuestionResponse Entity

```typescript
@Entity('brand_question_responses')
export class BrandQuestionResponse {
  id: string;                   // UUID primary key
  workspaceId: string;         // Associated workspace
  questionId: string;          // Associated question
  answer: string;              // User's answer
  metadata?: object;           // Additional metadata (file info, etc.)
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

## Question Types

### Supported Question Types

| Type | Description | Use Case |
|------|-------------|----------|
| `text` | Single line text input | Brand name, contact person |
| `textarea` | Multi-line text input | Brand description, company story |
| `select` | Dropdown selection | Industry, company size |
| `multi_select` | Multiple choice selection | Target demographics |
| `radio` | Radio button selection | Business model, primary focus |
| `checkbox` | Checkbox selection | Services offered, features |
| `url` | URL input | Website, social media links |
| `email` | Email input | Contact email |
| `number` | Numeric input | Employee count, revenue |
| `date` | Date picker | Founded date, launch date |
| `file_upload` | File upload | Logo, documents |

## API Endpoints

### Admin Endpoints (Question Management)

#### Create Question
```http
POST /brand-questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionText": "What is your brand name?",
  "description": "Enter your company or brand name",
  "questionType": "text",
  "isMandatory": true,
  "displayOrder": 1,
  "validationRules": {
    "required": true,
    "minLength": 2,
    "maxLength": 100
  }
}
```

#### Update Question
```http
PUT /brand-questions/:questionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionText": "Updated question text",
  "isMandatory": false,
  "displayOrder": 2
}
```

#### Delete Question
```http
DELETE /brand-questions/:questionId
Authorization: Bearer <token>
```

#### Get All Questions
```http
GET /brand-questions
Authorization: Bearer <token>
```

#### Reorder Questions
```http
PUT /brand-questions/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionIds": ["question-id-1", "question-id-2", "question-id-3"]
}
```

### User Endpoints (Questionnaire)

#### Get Questionnaire for Workspace
```http
GET /brand-questions/workspaces/:workspaceId/questionnaire
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "question-id",
        "questionText": "What is your brand name?",
        "questionType": "text",
        "isMandatory": true,
        "displayOrder": 1,
        "validationRules": {...}
      }
    ],
    "responses": [
      {
        "questionId": "question-id",
        "answer": "My Brand Name",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "completionStatus": {
      "totalQuestions": 5,
      "answeredQuestions": 3,
      "mandatoryQuestions": 3,
      "answeredMandatory": 2,
      "isComplete": false
    }
  }
}
```

#### Submit Questionnaire
```http
POST /brand-questions/workspaces/:workspaceId/questionnaire/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "responses": [
    {
      "questionId": "question-id-1",
      "answer": "My Brand Name"
    },
    {
      "questionId": "question-id-2",
      "answer": "https://mybrand.com",
      "metadata": {
        "fileUrl": "https://storage.com/logo.png",
        "fileType": "image/png"
      }
    }
  ]
}
```

#### Update Individual Response
```http
PUT /brand-questions/workspaces/:workspaceId/responses/:questionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "answer": "Updated answer",
}
```

#### Get Workspace Responses
```http
GET /brand-questions/workspaces/:workspaceId/responses
Authorization: Bearer <token>
```

#### Get Completion Status
```http
GET /brand-questions/workspaces/:workspaceId/completion-status
Authorization: Bearer <token>
```

### Workspace Integration Endpoints

#### Get Workspace Setup Progress
```http
GET /workspaces/:workspaceId/setup-progress
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspace": {...},
    "questionnaireStatus": {
      "isComplete": false,
      "missingMandatory": ["Brand description", "Target audience"]
    },
    "completionValidation": {
      "canComplete": false,
      "questionnaireComplete": false,
      "missingRequirements": [
        "Brand questionnaire not completed",
        "Missing mandatory questions: Brand description, Target audience"
      ]
    },
    "overallProgress": 65
  }
}
```

#### Complete Setup with Validation
```http
POST /workspaces/:workspaceId/complete-setup-validated
Authorization: Bearer <token>
```

#### Check if Can Complete
```http
GET /workspaces/:workspaceId/can-complete
Authorization: Bearer <token>
```

## Usage Examples

### 1. Creating a Comprehensive Brand Questionnaire

```typescript
// Example questions for a complete brand questionnaire
const brandQuestions = [
  {
    questionText: "What is your brand name?",
    questionType: "text",
    isMandatory: true,
    displayOrder: 1,
    validationRules: { required: true, minLength: 2, maxLength: 100 }
  },
  {
    questionText: "What industry does your brand operate in?",
    questionType: "select",
    options: ["Technology", "Healthcare", "Finance", "Retail", "Education", "Other"],
    isMandatory: true,
    displayOrder: 2
  },
  {
    questionText: "Describe your brand in one sentence",
    questionType: "textarea",
    isMandatory: true,
    displayOrder: 3,
    validationRules: { required: true, maxLength: 500 }
  },
  {
    questionText: "What is your brand's website?",
    questionType: "url",
    isMandatory: false,
    displayOrder: 4,
    validationRules: { pattern: "^https?://.+" }
  },
  {
    questionText: "Upload your brand logo",
    questionType: "file_upload",
    isMandatory: false,
    displayOrder: 5
  },
  {
    questionText: "Who is your target audience?",
    questionType: "multi_select",
    options: ["B2B", "B2C", "Enterprise", "SME", "Startups", "Individual Consumers"],
    isMandatory: true,
    displayOrder: 6
  }
];
```

### 2. Conditional Logic Example

```typescript
// Question that shows only if previous question was answered with "Technology"
const conditionalQuestion = {
  questionText: "What technology stack do you use?",
  questionType: "multi_select",
  options: ["React", "Vue.js", "Angular", "Node.js", "Python", "Java", "PHP"],
  isMandatory: false,
  displayOrder: 7,
  conditionalLogic: {
    dependsOn: "industry-question-id",
    condition: "equals",
    value: "Technology"
  }
};
```

### 3. Frontend Integration Example

```typescript
// React component example
const BrandQuestionnaire = ({ workspaceId }) => {
  const [questionnaire, setQuestionnaire] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionnaire();
  }, []);

  const fetchQuestionnaire = async () => {
    try {
      const response = await api.get(`/brand-questions/workspaces/${workspaceId}/questionnaire`);
      setQuestionnaire(response.data.data);
      // Pre-populate responses
      const existingResponses = {};
      response.data.data.responses.forEach(r => {
        existingResponses[r.questionId] = r.answer;
      });
      setResponses(existingResponses);
    } catch (error) {
      console.error('Failed to fetch questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const responseData = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        answer: answer.toString()
      }));

      await api.post(`/brand-questions/workspaces/${workspaceId}/questionnaire/submit`, {
        responses: responseData
      });

      // Check if questionnaire is complete
      const progressResponse = await api.get(`/workspaces/${workspaceId}/setup-progress`);
      const { overallProgress } = progressResponse.data.data;
      
      if (overallProgress === 100) {
        // Enable workspace completion
        showCompletionOption();
      }
    } catch (error) {
      console.error('Failed to submit questionnaire:', error);
    }
  };

  if (loading) return <div>Loading questionnaire...</div>;

  return (
    <div className="brand-questionnaire">
      <h2>Brand Information</h2>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${questionnaire.completionStatus.answeredQuestions / questionnaire.completionStatus.totalQuestions * 100}%` }}
        />
        <span>
          {questionnaire.completionStatus.answeredQuestions} of {questionnaire.completionStatus.totalQuestions} questions answered
        </span>
      </div>
      
      {questionnaire.questions.map(question => (
        <QuestionComponent
          key={question.id}
          question={question}
          value={responses[question.id] || ''}
          onChange={(value) => setResponses(prev => ({ ...prev, [question.id]: value }))}
        />
      ))}
      
      <button onClick={handleSubmit} className="submit-btn">
        Submit Questionnaire
      </button>
    </div>
  );
};
```

## Validation Rules

### Text/Textarea Validation
```typescript
{
  "required": true,
  "minLength": 2,
  "maxLength": 500,
  "pattern": "^[A-Za-z\\s]+$" // Only letters and spaces
}
```

### Number Validation
```typescript
{
  "required": true,
  "min": 1,
  "max": 1000000
}
```

### URL Validation
```typescript
{
  "required": false,
  "pattern": "^https?://.+"
}
```

### Email Validation
```typescript
{
  "required": true,
  "pattern": "^[^@]+@[^@]+\\.[^@]+$"
}
```

## Progress Calculation

The system calculates workspace setup progress as follows:

- **Basic Workspace Info (20%)**: Name and description filled
- **Brand Information (30%)**: Brand name and website provided
- **Questionnaire Completion (50%)**: All mandatory questions answered

### Progress Formula
```typescript
let progress = 0;

// Basic info (20%)
if (workspace.name && workspace.description) {
  progress += 20;
}

// Brand info (30%)
if (workspace.brandName && workspace.brandWebsite) {
  progress += 30;
}

// Questionnaire (50%)
if (questionnaireComplete) {
  progress += 50;
} else {
  const questionnaireProgress = (answeredMandatory / totalMandatory) * 50;
  progress += questionnaireProgress;
}

return Math.round(progress);
```

## Error Handling

### Common Error Responses

#### Missing Mandatory Questions
```json
{
  "statusCode": 400,
  "message": "Missing answers for mandatory questions: Brand name, Industry, Target audience",
  "error": "Bad Request"
}
```

#### Invalid Question Type
```json
{
  "statusCode": 400,
  "message": ["questionType must be one of the following values: text, textarea, select, multi_select, radio, checkbox, url, email, number, date, file_upload"],
  "error": "Bad Request"
}
```

#### Validation Failure
```json
{
  "statusCode": 400,
  "message": "Validation failed: answer must be at least 2 characters long",
  "error": "Bad Request"
}
```

## Security & Permissions

### Required Permissions
- **Question Management**: `workspace.create`, `workspace.update`, `workspace.delete`
- **Questionnaire Access**: `workspace.view`
- **Response Submission**: `workspace.update`

### Data Validation
- All inputs are validated using `class-validator`
- SQL injection protection through TypeORM
- XSS protection through input sanitization
- File upload restrictions and validation

## Performance Considerations

### Database Optimization
- Indexed on `workspaceId` and `questionId` for fast lookups
- Soft deletes for questions to maintain referential integrity
- Efficient querying with proper relations

### Caching Strategy
- Cache active questions list
- Cache questionnaire completion status
- Invalidate cache on question updates

## Migration & Deployment

### Database Migration
```sql
-- Create brand_questions table
CREATE TABLE brand_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text VARCHAR NOT NULL,
  description TEXT,
  question_type VARCHAR(20) NOT NULL DEFAULT 'text',
  options JSON,
  validation_rules JSON,
  display_order INTEGER DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  help_text TEXT,
  conditional_logic JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create brand_question_responses table
CREATE TABLE brand_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  question_id UUID NOT NULL,
  answer TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(workspace_id, question_id)
);

-- Add indexes
CREATE INDEX idx_brand_questions_display_order ON brand_questions(display_order);
CREATE INDEX idx_brand_questions_active ON brand_questions(is_active);
CREATE INDEX idx_brand_question_responses_workspace ON brand_question_responses(workspace_id);
CREATE INDEX idx_brand_question_responses_question ON brand_question_responses(question_id);
```

## Future Enhancements

### Planned Features
1. **Question Templates**: Pre-built question sets for different industries
2. **Advanced Conditional Logic**: Complex branching based on multiple conditions
3. **Question Analytics**: Track which questions are most/least answered
4. **Multi-language Support**: Questions and responses in multiple languages
5. **Question Versioning**: Track changes to questions over time
6. **Bulk Operations**: Import/export questions from CSV/JSON
7. **Question Dependencies**: Questions that depend on answers from other workspaces
8. **Advanced File Handling**: Multiple file uploads, file type restrictions
9. **Question Scoring**: Assign scores to answers for assessment purposes
10. **Integration APIs**: Webhooks for questionnaire completion events

### Technical Improvements
1. **Real-time Updates**: WebSocket support for live questionnaire updates
2. **Offline Support**: PWA capabilities for offline questionnaire completion
3. **Advanced Validation**: Custom validation functions
4. **Question Logic Builder**: Visual interface for creating conditional logic
5. **Analytics Dashboard**: Comprehensive reporting on questionnaire data

## Conclusion

The Brand Questionnaire System provides a robust, flexible foundation for collecting brand information within workspaces. Its configurable nature allows for easy adaptation to different business needs, while its integration with workspace setup ensures a smooth user onboarding experience.

The system follows SOLID principles and maintains the modular architecture of the application, making it easy to extend and maintain as the platform grows.
