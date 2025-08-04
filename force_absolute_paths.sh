# Single pass over both HTML and CSS
find out -type f \( -name '*.html' -o -name '*.css' \) -exec sed -i '' \
  -e 's/src="\/_next\//src=".\/_next\//g' \
  -e 's/href="\/_next\//href=".\/_next\//g' \
  -e 's#url(/_next/#url(./_next/#g' {} +

# # HTML
# find out -type f -name '*.html' -exec sed -i '' \
#   -e 's/src="\/_next\//src=".\/_next\//g' \
#   -e 's/href="\/_next\//href=".\/_next\//g' {} +

# # CSS
# find out -type f -name '*.css' -exec sed -i '' \
#   -e 's#url(/_next/#url(./_next/#g' {} +