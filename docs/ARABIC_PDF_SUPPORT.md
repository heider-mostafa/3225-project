# Arabic PDF Support Documentation

This document explains the Arabic text rendering solution implemented for PDF report generation in the OpenBeit real estate platform.

## Problem

jsPDF's default fonts only support ASCII characters, causing Arabic text to appear as garbled symbols or garbage characters in generated PDFs.

## Solution

We implemented a production-ready solution using the Amiri font from Google Fonts, which provides comprehensive Arabic text support.

## Implementation Details

### 1. Font Generation
- **Script**: `scripts/generate-amiri-font.js`
- **Command**: `npm run generate-arabic-font`
- **Source**: Downloads Amiri-Regular.ttf from Google Fonts GitHub repository
- **Output**: Generates base64-encoded font in `utils/amiri-font-base64.ts`

### 2. Font Integration
The PDF report generator (`lib/services/pdf-report-generator.ts`) includes:

- **Font Loading**: Automatically loads and embeds the Amiri font
- **Font Detection**: Detects Arabic text using Unicode range `[\u0600-\u06FF]`
- **Font Selection**: Uses Amiri for Arabic text, Helvetica for English
- **Text Processing**: Handles bidirectional text, spacing, and punctuation

### 3. Text Processing Features

#### Arabic Text Enhancement
- Unicode normalization (NFC)
- Bidirectional text marker removal
- Mixed Arabic-English spacing optimization
- Arabic punctuation normalization
- Eastern Arabic to Western numeral conversion
- UTF-8 encoding validation

#### Supported Characters
- Full Arabic alphabet (ء-ي)
- Arabic numerals (٠-٩)
- Arabic punctuation (؟،؛»«)
- Mixed Arabic-English text
- Arabic diacritics and marks

## Usage

### Basic PDF Generation
```typescript
import { PDFReportGenerator } from '@/lib/services/pdf-report-generator';

const pdfGenerator = new PDFReportGenerator();
const pdfBlob = await pdfGenerator.generateReport(
  propertyData,
  appraisalData,
  marketData,
  { language: 'both' } // Supports 'ar', 'en', or 'both'
);
```

### Font Regeneration
If you need to update the Arabic font:

```bash
npm run generate-arabic-font
```

This will:
1. Download the latest Amiri-Regular.ttf from Google Fonts
2. Convert it to base64 format
3. Generate `utils/amiri-font-base64.ts`
4. Save raw base64 to `utils/amiri-raw-base64.txt`

## File Structure

```
├── scripts/
│   └── generate-amiri-font.js      # Font download and conversion script
├── utils/
│   ├── amiri-font.ts               # Font loading utilities (optional)
│   ├── amiri-font-base64.ts        # Production font (auto-generated)
│   └── amiri-raw-base64.txt        # Raw base64 string (auto-generated)
├── lib/services/
│   └── pdf-report-generator.ts     # Main PDF generator with Arabic support
└── docs/
    └── ARABIC_PDF_SUPPORT.md       # This documentation
```

## Technical Specifications

### Font Details
- **Font**: Amiri-Regular.ttf
- **Source**: Google Fonts (Open Font License)
- **Size**: ~431KB (574,824 base64 characters)
- **Support**: Full Arabic Unicode range + Latin characters
- **License**: Open Font License (OFL)

### Browser Support
- All modern browsers with jsPDF support
- Client-side PDF generation
- No server dependencies required

## Troubleshooting

### Font Not Loading
If Arabic text still appears garbled:

1. Check browser console for font loading errors
2. Verify `utils/amiri-font-base64.ts` exists and is not empty
3. Regenerate font using `npm run generate-arabic-font`
4. Clear browser cache and reload

### Performance Considerations
- Font loading adds ~430KB to bundle size
- Consider lazy loading for non-Arabic applications
- Font is cached after first use

### Fallback Behavior
If the Amiri font fails to load:
- System falls back to Helvetica
- Warning logged to console
- Basic Arabic support attempted (limited)

## Development Notes

### Adding New Fonts
To add additional Arabic fonts:

1. Modify `scripts/generate-amiri-font.js`
2. Update font URL and filename
3. Adjust font registration in PDF generator
4. Test with various Arabic text samples

### Testing Arabic Text
Common test phrases:
- `مرحبا بالعالم` (Hello World)
- `تقرير تقييم عقاري` (Property Appraisal Report)
- `القيمة المقدرة: ١٢٣٤٥ جنيه مصري` (Mixed numbers and text)

## License

The Amiri font is distributed under the Open Font License (OFL).
This implementation is part of the OpenBeit platform.

## Support

For issues related to Arabic PDF generation:
1. Check this documentation
2. Verify font files exist and are valid
3. Test with sample Arabic text
4. Contact development team with specific examples