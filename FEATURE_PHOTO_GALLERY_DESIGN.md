# Feature 2: Race Photo Gallery with AWS Rekognition

## 📋 Executive Summary

Transform the **580+ race photos** currently embedded in blog posts into an intelligent, searchable photo gallery powered by AWS Rekognition. The system maintains the static site architecture while using batch AI processing to automatically tag and organize photos.

## 🏗️ Architecture Overview

### Current State
- **580 photos** stored in `site/img_running/YYYY-MM-DD/` directories
- Photos embedded manually in race blog posts
- No cross-post discovery or filtering
- No searchability beyond reading individual posts

### Proposed State
- Same photos, but **indexed and tagged** with AI-generated metadata
- Dedicated gallery pages with filtering by date, race, tags, quality
- Photos remain static files, metadata in JSON
- Zero runtime API calls (all processing done at build time)

## 🔄 AWS Rekognition Integration Workflow

### Phase 1: Photo Discovery & Indexing
```
GitHub Actions Trigger (weekly or on-demand)
    ↓
Python Script: scan_photos.py
    ↓
Discover all photos in site/img_running/
    ↓
Load existing photo index (_data/photo_index.json)
    ↓
Identify new/unprocessed photos
```

### Phase 2: Batch Upload to AWS
```
For each unprocessed photo:
    ↓
Upload to S3 bucket (temp storage)
    ↓
s3://moelholm-photo-processing/pending/YYYY-MM-DD/photo.jpg
```

**Why S3?** AWS Rekognition requires images to be in S3 or sent as bytes. For batch processing, S3 is more efficient.

### Phase 3: AWS Rekognition Analysis
```
Invoke AWS Rekognition DetectLabels API
    ↓
Request: { Bucket: "...", Key: "...", MaxLabels: 20, MinConfidence: 70 }
    ↓
Response: Labels with confidence scores
    [
      {Name: "Mountain", Confidence: 98.5},
      {Name: "Trail", Confidence: 95.2},
      {Name: "Person", Confidence: 92.1},
      {Name: "Sunset", Confidence: 89.3},
      {Name: "Sport", Confidence: 87.6}
    ]
    ↓
Also invoke DetectModerationLabels (detect inappropriate content)
    ↓
Also invoke DetectFaces (optional - for privacy filtering)
```

### Phase 4: Quality Assessment
```
Use Rekognition ImageQuality response
    ↓
Extract: Brightness, Sharpness, Contrast scores
    ↓
Calculate composite quality score (0-100)
    ↓
Flag "best photos" (quality > 85)
```

### Phase 5: Metadata Storage
```
For each processed photo:
    ↓
Create metadata entry:
{
  "path": "/img_running/2026-01-10/2026-01-10_872_small.jpg",
  "race_date": "2026-01-10",
  "race_slug": "race_ringkobingfjord",
  "processed_at": "2026-01-29T10:00:00Z",
  "labels": [
    {"name": "Mountain", "confidence": 98.5},
    {"name": "Trail", "confidence": 95.2},
    {"name": "Person", "confidence": 92.1}
  ],
  "quality_score": 87.3,
  "is_best": true,
  "moderation": {"safe": true},
  "has_faces": false,
  "dimensions": {"width": 600, "height": 600}
}
    ↓
Append to _data/photo_gallery.json
    ↓
Delete from S3 temp bucket (cleanup)
```

### Phase 6: Jekyll Build Integration
```
Jekyll build reads _data/photo_gallery.json
    ↓
Generates static gallery pages:
  - /gallery/ (all photos)
  - /gallery/best/ (quality > 85)
  - /gallery/2026/ (by year)
  - /gallery/tags/mountain/ (by tag)
    ↓
Client-side JavaScript enables filtering without page reload
```

## 💻 Implementation Details

### 1. GitHub Actions Workflow

**File:** `.github/workflows/process-photos.yml`

```yaml
name: Process Race Photos with Rekognition

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sundays at 2 AM
  workflow_dispatch:     # Manual trigger

permissions:
  contents: write
  id-token: write

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install boto3 Pillow

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_MOELHOLM_WWW }}
          aws-region: eu-north-1
          role-session-name: PhotoProcessing

      - name: Process photos with Rekognition
        env:
          S3_BUCKET: moelholm-photo-processing
          MAX_PHOTOS_PER_RUN: 100  # Rate limiting
        run: |
          python tools/process_photos_rekognition.py

      - name: Commit updated photo index
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add site/_data/photo_gallery.json
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "Update photo gallery metadata [skip ci]"
            git push
          fi
```

### 2. Python Processing Script

**File:** `tools/process_photos_rekognition.py`

```python
#!/usr/bin/env python3
"""
Process race photos with AWS Rekognition for intelligent tagging.

Workflow:
1. Scan site/img_running/ for all photos
2. Load existing photo_gallery.json index
3. Identify unprocessed photos
4. Upload to S3 temp bucket
5. Analyze with Rekognition (labels, quality, moderation)
6. Store metadata in photo_gallery.json
7. Cleanup S3 temp files
"""

import os
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import boto3
from PIL import Image

# Configuration
S3_BUCKET = os.environ.get('S3_BUCKET', 'moelholm-photo-processing')
PHOTO_DIR = Path('site/img_running')
DATA_FILE = Path('site/_data/photo_gallery.json')
MAX_PHOTOS_PER_RUN = int(os.environ.get('MAX_PHOTOS_PER_RUN', 100))

# AWS clients
s3_client = boto3.client('s3')
rekognition_client = boto3.client('rekognition', region_name='eu-north-1')


def calculate_photo_hash(photo_path: Path) -> str:
    """Generate SHA256 hash of photo for deduplication."""
    with open(photo_path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()[:16]


def extract_race_info(photo_path: Path) -> Dict[str, str]:
    """Extract race date and slug from photo path."""
    parts = photo_path.parts
    # Expected: site/img_running/2026-01-10/photo.jpg
    if len(parts) >= 3:
        race_date = parts[-2]  # 2026-01-10
        # Find corresponding race post
        race_slug = find_race_slug_for_date(race_date)
        return {"race_date": race_date, "race_slug": race_slug}
    return {"race_date": "unknown", "race_slug": "unknown"}


def find_race_slug_for_date(date_str: str) -> str:
    """Find race blog post matching this date."""
    race_posts = Path('site/blog_collections/_running').glob(f'{date_str}*.md')
    for post in race_posts:
        # Extract slug from filename: 2026-01-10-race_ringkobingfjord.md
        slug = post.stem.replace(date_str + '-', '')
        return slug
    return "unknown"


def upload_to_s3(photo_path: Path, s3_key: str) -> str:
    """Upload photo to S3 temp bucket, return S3 URI."""
    s3_client.upload_file(str(photo_path), S3_BUCKET, s3_key)
    return f's3://{S3_BUCKET}/{s3_key}'


def analyze_with_rekognition(s3_key: str) -> Dict:
    """Analyze photo using AWS Rekognition."""
    
    # Detect labels (scene, objects, activities)
    labels_response = rekognition_client.detect_labels(
        Image={'S3Object': {'Bucket': S3_BUCKET, 'Name': s3_key}},
        MaxLabels=20,
        MinConfidence=70,
        Features=['GENERAL_LABELS', 'IMAGE_PROPERTIES']
    )
    
    # Detect moderation labels (safety check)
    moderation_response = rekognition_client.detect_moderation_labels(
        Image={'S3Object': {'Bucket': S3_BUCKET, 'Name': s3_key}},
        MinConfidence=60
    )
    
    # Optional: Detect faces (for privacy filtering)
    faces_response = rekognition_client.detect_faces(
        Image={'S3Object': {'Bucket': S3_BUCKET, 'Name': s3_key}},
        Attributes=['DEFAULT']
    )
    
    return {
        'labels': labels_response,
        'moderation': moderation_response,
        'faces': faces_response
    }


def extract_metadata(analysis: Dict, photo_path: Path) -> Dict:
    """Extract and structure metadata from Rekognition response."""
    
    # Extract labels with confidence
    labels = [
        {'name': label['Name'], 'confidence': round(label['Confidence'], 1)}
        for label in analysis['labels'].get('Labels', [])
    ]
    
    # Calculate quality score from ImageProperties
    quality_score = 0
    if 'ImageProperties' in analysis['labels']:
        props = analysis['labels']['ImageProperties'].get('Quality', {})
        brightness = props.get('Brightness', 50)
        sharpness = props.get('Sharpness', 50)
        contrast = props.get('Contrast', 50)
        # Composite score (normalized to 0-100)
        quality_score = (brightness + sharpness + contrast) / 3
    
    # Check moderation (is content safe?)
    is_safe = len(analysis['moderation'].get('ModerationLabels', [])) == 0
    
    # Check for faces (privacy concern)
    has_faces = len(analysis['faces'].get('FaceDetails', [])) > 0
    
    # Get image dimensions
    with Image.open(photo_path) as img:
        width, height = img.size
    
    race_info = extract_race_info(photo_path)
    
    return {
        'path': '/' + str(photo_path.relative_to('site')),
        'hash': calculate_photo_hash(photo_path),
        'race_date': race_info['race_date'],
        'race_slug': race_info['race_slug'],
        'processed_at': datetime.utcnow().isoformat() + 'Z',
        'labels': labels,
        'quality_score': round(quality_score, 1),
        'is_best': quality_score > 85,
        'moderation': {'safe': is_safe},
        'has_faces': has_faces,
        'dimensions': {'width': width, 'height': height}
    }


def load_photo_index() -> Dict[str, Dict]:
    """Load existing photo gallery index."""
    if DATA_FILE.exists():
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            return {item['hash']: item for item in data}
    return {}


def save_photo_index(index: Dict[str, Dict]):
    """Save photo gallery index."""
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    photos_list = list(index.values())
    # Sort by race_date descending
    photos_list.sort(key=lambda x: x['race_date'], reverse=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(photos_list, f, indent=2)


def main():
    print("🔍 Scanning for race photos...")
    
    # Find all photos
    all_photos = list(PHOTO_DIR.glob('*/*.jpg'))
    print(f"Found {len(all_photos)} total photos")
    
    # Load existing index
    photo_index = load_photo_index()
    print(f"Found {len(photo_index)} previously processed photos")
    
    # Identify unprocessed photos
    unprocessed = []
    for photo_path in all_photos:
        photo_hash = calculate_photo_hash(photo_path)
        if photo_hash not in photo_index:
            unprocessed.append((photo_path, photo_hash))
    
    print(f"Found {len(unprocessed)} unprocessed photos")
    
    # Limit processing per run (rate limiting)
    unprocessed = unprocessed[:MAX_PHOTOS_PER_RUN]
    print(f"Processing {len(unprocessed)} photos this run")
    
    # Process each photo
    for i, (photo_path, photo_hash) in enumerate(unprocessed, 1):
        print(f"\n[{i}/{len(unprocessed)}] Processing {photo_path.name}...")
        
        try:
            # Upload to S3
            s3_key = f"pending/{photo_path.relative_to(PHOTO_DIR)}"
            print(f"  Uploading to S3: {s3_key}")
            upload_to_s3(photo_path, s3_key)
            
            # Analyze with Rekognition
            print(f"  Analyzing with Rekognition...")
            analysis = analyze_with_rekognition(s3_key)
            
            # Extract metadata
            metadata = extract_metadata(analysis, photo_path)
            
            # Add to index
            photo_index[photo_hash] = metadata
            
            print(f"  ✅ Quality: {metadata['quality_score']}, Labels: {len(metadata['labels'])}")
            print(f"     Top labels: {', '.join([l['name'] for l in metadata['labels'][:5]])}")
            
            # Cleanup S3
            s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
            
        except Exception as e:
            print(f"  ❌ Error processing {photo_path.name}: {e}")
            continue
    
    # Save updated index
    print(f"\n💾 Saving photo index with {len(photo_index)} photos...")
    save_photo_index(photo_index)
    
    print("✅ Photo processing complete!")


if __name__ == '__main__':
    main()
```

### 3. Jekyll Gallery Page

**File:** `site/gallery.md`

```markdown
---
layout: default
title: Photo Gallery - moelholm.com
permalink: /gallery/
stylesheets: ["/css/gallery.css"]
---

<h1>Photo Gallery</h1>
<p>Browse {{ site.data.photo_gallery | size }} race photos, intelligently organized with AI.</p>

<!-- Filter Controls -->
<div class="gallery-filters mb-4">
  <button class="filter-btn active" data-filter="all">All Photos</button>
  <button class="filter-btn" data-filter="best">Best Quality</button>
  <button class="filter-btn" data-filter="trail">Trail</button>
  <button class="filter-btn" data-filter="mountain">Mountain</button>
  <button class="filter-btn" data-filter="sunset">Sunset</button>
  <button class="filter-btn" data-filter="finish">Finish Line</button>
</div>

<!-- Photo Grid -->
<div class="photo-grid" id="photoGrid">
  {% for photo in site.data.photo_gallery %}
    {% assign tags = photo.labels | map: "name" | join: "," | downcase %}
    <div class="photo-item" 
         data-tags="{{ tags }}"
         data-quality="{{ photo.quality_score }}"
         data-best="{{ photo.is_best }}"
         data-race="{{ photo.race_slug }}">
      <img src="{{ photo.path }}" 
           alt="{{ photo.race_slug }}"
           loading="lazy"
           class="spotlight">
      <div class="photo-meta">
        <span class="photo-date">{{ photo.race_date }}</span>
        {% if photo.is_best %}
          <span class="badge badge-best">⭐ Best</span>
        {% endif %}
        <span class="photo-quality">Q: {{ photo.quality_score }}</span>
      </div>
      <div class="photo-tags">
        {% for label in photo.labels limit:3 %}
          <span class="tag-chip">{{ label.name }}</span>
        {% endfor %}
      </div>
    </div>
  {% endfor %}
</div>

<script src="/assets/gallery-filter.js"></script>
```

### 4. Client-Side Filtering

**File:** `site/assets/gallery-filter.js`

```javascript
// Client-side photo filtering (no backend needed)
document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const photoGrid = document.getElementById('photoGrid');
  const photoItems = photoGrid.querySelectorAll('.photo-item');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.dataset.filter;
      
      // Update active button
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Filter photos
      photoItems.forEach(item => {
        if (filter === 'all') {
          item.style.display = '';
        } else if (filter === 'best') {
          item.style.display = item.dataset.best === 'true' ? '' : 'none';
        } else {
          const tags = item.dataset.tags.toLowerCase();
          item.style.display = tags.includes(filter) ? '' : 'none';
        }
      });
    });
  });
});
```

## 💰 Cost Analysis

### AWS Rekognition Pricing (EU-North-1)

| Service | Cost | Your Usage | Monthly Cost |
|---------|------|------------|--------------|
| DetectLabels | $1.00 per 1,000 images | 580 images (one-time) + ~20/month new | **$0.60 initial + $0.02/month** |
| DetectModerationLabels | $1.00 per 1,000 images | Same as above | **$0.60 initial + $0.02/month** |
| DetectFaces | $1.00 per 1,000 images | Same as above (optional) | **$0.60 initial + $0.02/month** |
| **Total** | | | **~$2 initial + $0.06/month** |

### S3 Storage Pricing

| Service | Cost | Your Usage | Monthly Cost |
|---------|------|------------|--------------|
| S3 Standard Storage | $0.023 per GB/month | Temp storage (~1 GB max during processing) | **~$0.02** |
| PUT/GET requests | $0.005 per 1,000 PUT | 580 uploads + 580 deletes | **$0.006 initial** |
| **Total** | | | **Negligible (~$0.03/month)** |

### Total Cost
- **Initial processing**: ~$2.50 (one-time for 580 existing photos)
- **Ongoing**: ~$0.10/month (assuming 20 new photos/month)
- **Annual**: ~$1.20/year after initial investment

**Conclusion**: Extremely cost-effective! Less than a cup of coffee per year. ☕

## 🚀 Benefits

### For You (Site Owner)
1. **No manual tagging** - AI does it automatically
2. **Quality filtering** - Easily find your best shots
3. **Better content discovery** - Photos become searchable
4. **Privacy protection** - Auto-detect faces for filtering
5. **One-time setup** - Runs automatically via GitHub Actions

### For Visitors
1. **Browse race photos** without reading entire blog posts
2. **Filter by interest** - trail, mountain, sunset, etc.
3. **Discover similar races** through visual similarity
4. **Higher quality experience** - best photos highlighted
5. **Fast loading** - static files, no API calls

## ⚠️ Challenges & Solutions

### Challenge 1: Rate Limiting
**Problem**: Rekognition has request limits
**Solution**: Process max 100 photos per run, spread over time

### Challenge 2: Cost Control
**Problem**: Accidental reprocessing could cost money
**Solution**: Hash-based deduplication ensures each photo processed once

### Challenge 3: Label Quality
**Problem**: AI might misidentify subjects
**Solution**: Manual override in photo metadata, human review of "best" photos

### Challenge 4: Privacy Concerns
**Problem**: Photos might contain faces or sensitive locations
**Solution**: DetectFaces API identifies photos with people, can auto-blur or flag for review

### Challenge 5: Historical EXIF Data
**Problem**: Some photos might lack race context
**Solution**: Use directory structure (date-based) and cross-reference with race posts

## 🔐 Security & Privacy

### S3 Bucket Configuration
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/GitHubActionsRole"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::moelholm-photo-processing/pending/*"
    }
  ]
}
```

### IAM Policy for GitHub Actions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectLabels",
        "rekognition:DetectModerationLabels",
        "rekognition:DetectFaces"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::moelholm-photo-processing/pending/*"
    }
  ]
}
```

### Lifecycle Policy (Auto-cleanup)
```json
{
  "Rules": [
    {
      "Id": "CleanupPendingPhotos",
      "Status": "Enabled",
      "Prefix": "pending/",
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
```

## 📊 Example Output

### Sample photo_gallery.json Entry
```json
{
  "path": "/img_running/2026-01-10/2026-01-10_872_small.jpg",
  "hash": "a3f5b8c9d2e1f4a7",
  "race_date": "2026-01-10",
  "race_slug": "race_ringkobingfjord",
  "processed_at": "2026-01-29T10:15:32Z",
  "labels": [
    {"name": "Nature", "confidence": 99.8},
    {"name": "Outdoors", "confidence": 99.5},
    {"name": "Sky", "confidence": 98.2},
    {"name": "Snow", "confidence": 96.7},
    {"name": "Winter", "confidence": 95.3},
    {"name": "Ice", "confidence": 94.1},
    {"name": "Landscape", "confidence": 92.8},
    {"name": "Mountain", "confidence": 89.4},
    {"name": "Path", "confidence": 87.6},
    {"name": "Trail", "confidence": 85.2}
  ],
  "quality_score": 87.3,
  "is_best": true,
  "moderation": {"safe": true},
  "has_faces": false,
  "dimensions": {"width": 600, "height": 600}
}
```

## 🎯 Future Enhancements

1. **Similar Photo Detection** - Use Rekognition's image similarity to find visually similar races
2. **Dominant Color Extraction** - Create color-based themes for gallery views
3. **Text Detection** - Extract race bibs, signage for additional metadata
4. **Celebrity Recognition** - Detect well-known runners if they appear in photos
5. **Scene Classification** - Differentiate between "start line", "trail", "finish", "aid station"
6. **Weather Correlation** - Cross-reference with weather data for context

## ✅ Deployment Checklist

- [ ] Create S3 bucket `moelholm-photo-processing`
- [ ] Configure S3 lifecycle policy for auto-cleanup
- [ ] Create IAM role for GitHub Actions with Rekognition + S3 permissions
- [ ] Add OIDC trust relationship for GitHub Actions
- [ ] Store AWS role ARN in GitHub Secrets
- [ ] Create `tools/process_photos_rekognition.py` script
- [ ] Create `.github/workflows/process-photos.yml` workflow
- [ ] Create `site/_data/` directory
- [ ] Create `site/gallery.md` page
- [ ] Create `site/assets/gallery-filter.js` script
- [ ] Create `site/css/gallery.css` styles
- [ ] Test with 10 photos first (manual workflow_dispatch trigger)
- [ ] Review results, adjust confidence thresholds
- [ ] Process all 580 photos (one-time batch)
- [ ] Enable weekly scheduled runs
- [ ] Add gallery link to main navigation

## 🎨 UI Mockup Concepts

### Gallery Grid Layout
```
┌─────────────────────────────────────────────────────────┐
│  Photo Gallery                                    [580] │
│  ─────────────────────────────────────────────────────  │
│  [All] [Best] [Trail] [Mountain] [Sunset] [Finish]     │
│  ─────────────────────────────────────────────────────  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  │ ⭐ │ │    │ │    │ │ ⭐ │ │    │ │    │            │
│  │img │ │img │ │img │ │img │ │img │ │img │            │
│  │ Q87│ │ Q72│ │ Q91│ │ Q89│ │ Q75│ │ Q68│            │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  │    │ │ ⭐ │ │    │ │    │ │    │ │ ⭐ │            │
│  │img │ │img │ │img │ │img │ │img │ │img │            │
│  │ Q81│ │ Q94│ │ Q73│ │ Q79│ │ Q66│ │ Q88│            │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘            │
└─────────────────────────────────────────────────────────┘
```

### Photo Detail View (Lightbox)
```
┌─────────────────────────────────────────────────────────┐
│  [←]                                              [×]    │
│                                                          │
│              ┌────────────────────┐                      │
│              │                    │                      │
│              │                    │                      │
│              │   Photo Enlarged   │                      │
│              │                    │                      │
│              │                    │                      │
│              └────────────────────┘                      │
│                                                          │
│  2026-01-10 · Ringkøbing Fjord     Quality: 87 ⭐       │
│  🏷️ Nature, Snow, Winter, Ice, Landscape, Trail        │
│                                                          │
│                                           [→]           │
└─────────────────────────────────────────────────────────┘
```

## 📝 Summary

The Race Photo Gallery with AWS Rekognition integration transforms your static photo collection into an intelligent, searchable gallery while:

✅ **Maintaining static site architecture** - no runtime APIs  
✅ **Costing almost nothing** - ~$2.50 initial + $0.10/month  
✅ **Running automatically** - GitHub Actions weekly processing  
✅ **Respecting privacy** - face detection and content moderation  
✅ **Improving discoverability** - AI-powered tagging  
✅ **Requiring minimal maintenance** - set it and forget it  

The system uses AWS Rekognition in batch mode (not real-time), stores all metadata as static JSON, and generates fully static HTML pages - perfectly aligned with your Jekyll + GitHub Pages architecture!
