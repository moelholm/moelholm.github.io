#!/bin/bash

#
# Quick n dirty conversion script (I use this to convert iPhone *.heic to smaller *.jpg for the posts). 
#
# Expects:
#
# ./convert-all.sh
# ./input/*.heic
# ./output/*jpg
#

mkdir -p output
cd input
for file in *.[Hh][Ee][Ii][Cc]; do
  echo "Converting $file"
  magick "$file" -resize 600x600 -quality 100 "../output/${file%.*}.jpg"
done
cd ..
