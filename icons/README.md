# Icon Generation Instructions

Since this is a text-based environment, I've created an SVG template. To generate the PNG icons:

## Option 1: Use an online SVG to PNG converter

1. Open `icon.svg` in a text editor
2. Go to any online SVG to PNG converter (e.g., cloudconvert.com, convertio.co)
3. Convert the SVG to PNG at these sizes:
   - 16x16 pixels → save as `icon16.png`
   - 48x48 pixels → save as `icon48.png`
   - 128x128 pixels → save as `icon128.png`

## Option 2: Use ImageMagick (if installed)

Run these commands in the terminal from the icons directory:

```bash
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

## Option 3: Use Inkscape (if installed)

```bash
inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16
inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48
inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128
```

## Temporary Workaround

If you don't have tools to convert SVG to PNG right now, you can:

1. Use any small PNG images (16x16, 48x48, 128x128) as placeholders
2. Or use an online icon generator for Chrome extensions
3. The extension will still work, but may show a generic icon

The icon design shows a red recording indicator circle on a purple gradient background.
