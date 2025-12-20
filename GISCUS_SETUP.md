# GitHub Discussions (giscus) Setup Guide

This site uses [giscus](https://giscus.app/) - a comments system powered by GitHub Discussions. This replaces the previous Disqus integration with a privacy-friendly, GitHub-native solution.

## Architecture Overview

### What is giscus?

giscus is a commenting system that uses GitHub Discussions as a backend. When visitors comment on your blog posts, their comments are stored as GitHub Discussion posts in your repository.

**Benefits:**
- ✅ **GitHub-native**: Uses official GitHub Discussions API
- ✅ **Privacy-friendly**: No third-party tracking or ads
- ✅ **Free**: No costs for public repositories
- ✅ **Open source**: Full transparency and control
- ✅ **Rich features**: Markdown, reactions, threading, moderation
- ✅ **GitHub authentication**: Visitors use their GitHub accounts
- ✅ **No lock-in**: All comments stored in your repository

### How it Works

1. **Blog Post → Discussion Mapping**: Each blog post with `comments: true` gets automatically mapped to a GitHub Discussion
2. **Automatic Creation**: When someone comments, giscus creates a Discussion if it doesn't exist
3. **Pathname Mapping**: Discussions are matched using the blog post's pathname (URL)
4. **Real-time Sync**: Comments appear instantly on both the blog and GitHub Discussions

## Setup Instructions

### Step 1: Enable GitHub Discussions

1. Go to your repository: `https://github.com/moelholm/moelholm.github.io`
2. Click **Settings** tab
3. Scroll to **Features** section
4. Check ✅ **Discussions**

### Step 2: Create a Discussion Category

1. Go to the **Discussions** tab in your repository
2. Click the ⚙️ gear icon (Categories)
3. Create a new category:
   - **Name**: `Blog Comments`
   - **Description**: `Comments from blog posts`
   - **Format**: Choose "Announcement" (only you can create threads, visitors can comment)

### Step 3: Install the giscus App

1. Visit https://github.com/apps/giscus
2. Click **Install**
3. Select **moelholm/moelholm.github.io** repository
4. Grant permissions (read Discussions, write comments)

### Step 4: Get Configuration IDs

1. Visit https://giscus.app/
2. Fill in the configuration form:
   - **Repository**: `moelholm/moelholm.github.io`
   - **Page ↔️ Discussions Mapping**: Choose "pathname"
   - **Discussion Category**: Select "Blog Comments"
   - **Features**: Enable reactions
   - **Theme**: "Preferred color scheme"
3. Copy the generated `data-repo-id` and `data-category-id` values

### Step 5: Update Configuration

Edit `site/_config.yml` and update the giscus section:

```yaml
giscus:
  repo_id: "R_kgDOABCDEF"  # Replace with your actual repo_id
  category_id: "DIC_kwDOABCDEFGH"  # Replace with your actual category_id
```

### Step 6: Deploy

1. Commit your changes
2. Push to GitHub
3. GitHub Pages will rebuild automatically
4. Comments will now use GitHub Discussions!

## Testing the Integration

### Local Testing

1. Start the development server:
   ```bash
   ./dev-server.sh
   ```

2. Visit a blog post with `comments: true` in the front matter

3. You should see the giscus comment widget at the bottom

4. **Note**: In local development, you need to sign in with GitHub to see/test comments

### Production Testing

After deployment to GitHub Pages:

1. Visit any blog post with comments enabled
2. Scroll to the bottom to see the comment section
3. Sign in with your GitHub account
4. Leave a test comment
5. Verify it appears in your repository's Discussions tab

## Managing Comments

### View All Comments

Visit your repository's **Discussions** tab to see all blog comments in one place.

### Moderate Comments

As the repository owner, you can:
- Edit any comment
- Delete spam or inappropriate comments  
- Lock discussions
- Pin important comments
- React with emojis

### Notifications

You'll receive GitHub notifications for:
- New comments on your blog posts
- Replies to your comments
- @mentions

Configure notification preferences in GitHub Settings → Notifications

## Migration from Disqus

### What Happens to Old Disqus Comments?

Old Disqus comments will remain accessible on Disqus.com, but won't appear on your blog anymore. You have two options:

**Option 1: Fresh Start** (Recommended)
- Start fresh with GitHub Discussions
- Old comments remain on Disqus for archival purposes
- Simpler and cleaner migration

**Option 2: Manual Migration**
- Export comments from Disqus
- Manually recreate important discussions in GitHub Discussions
- Link to the relevant blog post

### Transition Strategy

1. **Enable giscus** on your site (already done! ✅)
2. **Keep Disqus comments for 30 days** as read-only reference
3. **Announce the change** in a blog post
4. **Archive important discussions** if needed
5. **Disable Disqus** completely after transition period

## Customization

### Styling

The giscus widget inherits your site's theme automatically. Custom styles are defined in `site/css/site.scss`:

```scss
.giscus-comments {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px dashed rgba(252, 76, 2, 0.15);
}
```

### Color Themes

The widget uses `data-theme="preferred_color_scheme"` which automatically switches between light and dark modes based on the visitor's system preferences.

Available themes:
- `preferred_color_scheme` (automatic)
- `light`
- `dark`
- `dark_dimmed`
- Many more at https://giscus.app/

### Mapping Strategies

Current mapping: `pathname` (recommended)

Alternative mapping options:
- `url`: Full URL including domain
- `title`: Blog post title
- `og:title`: OpenGraph title meta tag
- `specific`: Manual mapping per post
- `number`: Discussion number

Pathname is most reliable for Jekyll sites.

## Troubleshooting

### Comments Not Appearing

1. **Check Discussions are enabled**: Repository Settings → Features → Discussions ✅
2. **Verify giscus app is installed**: https://github.com/apps/giscus
3. **Confirm category exists**: Discussions tab → Categories → "Blog Comments"
4. **Check configuration IDs**: Correct `repo_id` and `category_id` in `_config.yml`
5. **Clear browser cache**: Force refresh with Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)

### "Not Found" Error

- The repository must be **public**
- giscus app must have access to the repository
- Discussion category must exist

### Comments on Wrong Post

- Using `pathname` mapping should prevent this
- Check that blog post URLs are unique
- Verify the `data-mapping` attribute in `giscus.html`

### Styling Issues

- giscus uses an iframe for security
- Some styles may not apply due to iframe isolation
- Use giscus's built-in themes instead

## Technical Details

### Files Modified

1. **`site/_includes/giscus.html`** - New include with giscus embed code
2. **`site/_layouts/post.html`** - Updated to use giscus instead of disqus
3. **`site/_layouts/default.html`** - Removed Disqus count script
4. **`site/css/site.scss`** - Added giscus styling
5. **`site/_config.yml`** - Added giscus configuration

### Old Files (Keep for Reference)

- **`site/_includes/disqus.html`** - Original Disqus implementation (can be removed later)

### How Comments are Mapped

When a visitor views a blog post at `/blog/running/2024/12/20/my-race/`:

1. giscus extracts the pathname: `/blog/running/2024/12/20/my-race/`
2. Searches for a Discussion with matching metadata
3. If not found, creates a new Discussion in "Blog Comments" category
4. Displays existing comments and allows new ones

### Privacy Implications

**User Privacy:**
- Visitors must have a GitHub account to comment
- Comments are public (stored in public Discussions)
- GitHub's privacy policy applies
- No third-party tracking cookies (unlike Disqus)

**Repository Owner:**
- All comment data stays in your repository
- Full control over data and moderation
- Can export/backup via GitHub API
- No dependency on external services

## Resources

- **giscus Website**: https://giscus.app/
- **giscus Documentation**: https://github.com/giscus/giscus
- **GitHub Discussions Docs**: https://docs.github.com/en/discussions
- **Configuration Generator**: https://giscus.app/ (interactive tool)

## Support

If you encounter issues:

1. Check this documentation
2. Review giscus troubleshooting: https://github.com/giscus/giscus/blob/main/TROUBLESHOOTING.md
3. Open an issue in the giscus repository: https://github.com/giscus/giscus/issues
4. Check GitHub Discussions documentation

---

**Note**: This setup was implemented on December 20, 2024 to replace the previous Disqus integration with a more privacy-friendly and GitHub-native solution.
