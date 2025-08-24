#!/usr/bin/env python3
"""
HEIC to JPG Converter for Blog Photos

This script converts HEIC/HEIF photos to JPG format and organizes them by date.
It automatically extracts the date from EXIF data and creates appropriate directories.

Usage:
    python3 tools/convert_heic_photos.py <input_directory> [output_base_directory]

Examples:
    python3 tools/convert_heic_photos.py _temp_photos
    python3 tools/convert_heic_photos.py _temp_photos img_running
    python3 tools/convert_heic_photos.py ~/Desktop/race_photos img_running

The script will:
1. Read all HEIC/HEIF files from the input directory
2. Extract the date taken from EXIF data
3. Create a directory like img_running/YYYY-MM-DD/
4. Center-crop to a square and resize to exactly 600x600 pixels (no stretching)
5. Save as high-quality JPG files

Requirements:
    - pillow-heif (automatically installed in this codespace)
    - Pillow (PIL)
"""

import os
import sys
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS
import pillow_heif


def extract_date_from_exif(image_path):
    """Extract the date taken from EXIF data."""
    try:
        # Register HEIF opener with Pillow
        pillow_heif.register_heif_opener()
        
        # Open image and get EXIF data
        image = Image.open(image_path)
        exif_data = image.getexif()
        
        if exif_data:
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                
                # Look for date taken fields
                if tag in ['DateTime', 'DateTimeOriginal', 'DateTimeDigitized']:
                    try:
                        # Parse the datetime string (format: "YYYY:MM:DD HH:MM:SS")
                        date_obj = datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
                        return date_obj.strftime("%Y-%m-%d")
                    except ValueError:
                        continue
        
        # Fallback to file modification time if no EXIF date found
        file_time = os.path.getmtime(image_path)
        date_obj = datetime.fromtimestamp(file_time)
        print(f"Warning: No EXIF date found for {os.path.basename(image_path)}, using file modification date")
        return date_obj.strftime("%Y-%m-%d")
        
    except Exception as e:
        # Final fallback to current date
        print(f"Error extracting date from {os.path.basename(image_path)}: {e}")
        print("Using current date as fallback")
        return datetime.now().strftime("%Y-%m-%d")


def convert_heic_photos(input_dir, output_base_dir="img_running", max_size=600, quality=95):
    """
    Convert HEIC photos to JPG and organize by date.
    
    Args:
        input_dir (str): Directory containing HEIC files
        output_base_dir (str): Base directory for output (default: img_running)
    max_size (int): Output square size (default: 600 - creates 600x600 images)
        quality (int): JPEG quality (default: 95)
    """
    
    # Register HEIF opener with Pillow
    pillow_heif.register_heif_opener()
    
    # Check if input directory exists
    if not os.path.exists(input_dir):
        print(f"Error: Input directory '{input_dir}' does not exist")
        return False
    
    # Get all HEIC/HEIF files
    heic_extensions = ('.heic', '.heif', '.HEIC', '.HEIF')
    heic_files = [f for f in os.listdir(input_dir) if f.lower().endswith(heic_extensions)]
    
    if not heic_files:
        print(f"No HEIC/HEIF files found in '{input_dir}'")
        return False
    
    print(f"Found {len(heic_files)} HEIC/HEIF files to convert")
    
    # Group files by date
    files_by_date = {}
    for filename in heic_files:
        input_path = os.path.join(input_dir, filename)
        date_str = extract_date_from_exif(input_path)
        
        if date_str not in files_by_date:
            files_by_date[date_str] = []
        files_by_date[date_str].append(filename)
    
    # Convert files for each date
    total_converted = 0
    total_failed = 0
    
    for date_str, files in files_by_date.items():
        print(f"\nProcessing {len(files)} files for date {date_str}")
        
        # Create output directory for this date
        output_dir = os.path.join(output_base_dir, date_str)
        os.makedirs(output_dir, exist_ok=True)
        
        # Convert each file
        for filename in files:
            try:
                input_path = os.path.join(input_dir, filename)
                
                # Open and convert
                image = Image.open(input_path)

                # Center-crop to square to avoid stretching
                width, height = image.size
                if width != height:
                    side = min(width, height)
                    left = (width - side) // 2
                    upper = (height - side) // 2
                    right = left + side
                    lower = upper + side
                    image = image.crop((left, upper, right, lower))

                # Resize to target square size
                if image.size != (max_size, max_size):
                    image = image.resize((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Convert to RGB if needed
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Generate output filename
                base_name = os.path.splitext(filename)[0]
                output_filename = base_name + '.jpg'
                output_path = os.path.join(output_dir, output_filename)
                
                # Save as JPG
                image.save(output_path, 'JPEG', quality=quality)
                print(f"  ✓ {filename} → {output_dir}/{output_filename}")
                total_converted += 1
                
            except Exception as e:
                print(f"  ✗ Failed to convert {filename}: {e}")
                total_failed += 1
    
    print(f"\n" + "="*50)
    print(f"Conversion complete!")
    print(f"Successfully converted: {total_converted} files")
    print(f"Failed conversions: {total_failed} files")
    
    if total_converted > 0:
        print(f"\nConverted photos are organized in:")
        for date_str in sorted(files_by_date.keys()):
            output_dir = os.path.join(output_base_dir, date_str)
            file_count = len([f for f in os.listdir(output_dir) if f.endswith('.jpg')])
            print(f"  {output_dir}/ ({file_count} photos)")
    
    return total_converted > 0


def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) < 2 or sys.argv[1] in ['--help', '-h', 'help']:
        print("HEIC to JPG Converter for Blog Photos")
        print("="*40)
        print("Usage: python3 tools/convert_heic_photos.py <input_directory> [output_base_directory]")
        print("\nDescription:")
        print("  Converts HEIC/HEIF photos to JPG format and organizes them by date.")
        print("  Automatically extracts date from EXIF data and creates directories.")
        print("\nArguments:")
        print("  input_directory        Directory containing HEIC/HEIF files")
        print("  output_base_directory  Base directory for output (default: img_running)")
        print("\nExamples:")
        print("  python3 tools/convert_heic_photos.py _temp_photos")
        print("  python3 tools/convert_heic_photos.py _temp_photos img_running")
        print("  python3 tools/convert_heic_photos.py ~/Desktop/race_photos")
        print("\nFeatures:")
        print("  • Automatic date extraction from EXIF data")
        print("  • Creates date-based directories (YYYY-MM-DD)")
        print("  • Resizes to exactly 600x600 pixels (square format)")
        print("  • High-quality JPEG output (95% quality)")
        print("  • Batch processing of multiple files")
        if len(sys.argv) < 2:
            sys.exit(1)
        else:
            sys.exit(0)
    
    input_dir = sys.argv[1]
    output_base_dir = sys.argv[2] if len(sys.argv) > 2 else "img_running"
    
    print("HEIC to JPG Converter for Blog Photos")
    print("="*40)
    print(f"Input directory: {input_dir}")
    print(f"Output base directory: {output_base_dir}")
    print(f"Photo size: 600x600 pixels (square)")
    print(f"JPEG quality: 95%")
    print("="*40)
    
    success = convert_heic_photos(input_dir, output_base_dir)
    
    if success:
        print("\n🎉 Conversion completed successfully!")
        print("You can now add the converted photos to your blog posts.")
    else:
        print("\n❌ Conversion failed or no files processed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
