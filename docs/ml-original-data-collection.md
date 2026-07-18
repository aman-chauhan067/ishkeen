# Original Data Collection Design (Fallback Path)

If we cannot legally acquire external datasets like ACNE04, we will fall back to collecting an original consented dataset. 

## 1. Consent and Privacy Principles
- **No Scraping**: We will absolutely not scrape public websites, Kaggle, or Google Images.
- **No Silent Reuse**: Ordinary product uploads by Ishkeen users will **never** be silently reused for training. 
- **Explicit Informed Consent**: We will implement a separate, dedicated "Opt-in to Research" flow.
- **Separation of Concerns**: Consent to receive an Ishkeen analysis (ephemeral/transactional) is strictly separated from consent to store the image for ML model training.

## 2. Subject Eligibility & Rights
- **Age Gate**: Participants must explicitly verify they are 18 or older.
- **Withdrawal**: Users can revoke consent at any time via their profile settings.
- **Deletion**: Revoking consent triggers an immediate hard deletion of the physical image file and associated ML metadata.
- **Retention**: Images are retained only as long as they are actively used for ML training and evaluation, capped at a defined retention period (e.g., 2 years) unless re-consented.

## 3. Data Handling & De-identification
- **Limitation of De-identification**: True facial de-identification is impossible without destroying the very features (acne on cheeks/forehead) we need to detect. We must treat these images as highly sensitive PII (Personally Identifiable Information).
- **Metadata Stripping**: All EXIF data, GPS coordinates, and device info will be stripped upon upload.
- **Storage Isolation**: Research images will be stored in a dedicated, highly restricted bucket (e.g., `s3://ishkeen-ml-research-data`), entirely isolated from production user storage.

## 4. Subject IDs & Split Isolation
- **Participant ID**: A one-way hashed UUID will be assigned to each consented subject, decoupling their training data from their production User ID.
- **Train/Val/Test Isolation**: The ML `split_engine` will use this Participant ID to strictly guarantee that images from the same person never cross the Train, Validation, or Test boundaries.

## 5. Annotation Workflow
- **Process**: Images will be batch-exported to a secure local annotation tool (like CVAT or Label Studio).
- **Guidelines**: Annotators will draw precise bounding boxes around active inflammatory lesions (papules, pustules, nodules) and comedones.
- **Quality Review (QA)**: A secondary reviewer will sample 10% of annotated images to verify bounding box tightness, consistency, and label accuracy.
