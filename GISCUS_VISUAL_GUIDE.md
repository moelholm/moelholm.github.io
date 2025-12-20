# GitHub Discussions (giscus) - Visual Guide

## What You'll See After Configuration

Once you complete the setup steps in `GISCUS_SETUP.md`, the giscus commenting widget will appear at the bottom of each blog post that has `comments: true` in its front matter.

### The giscus Comment Widget

The giscus widget will be embedded as an iframe at the bottom of your blog posts. It includes:

1. **Sign in with GitHub button** - Visitors click this to authenticate with their GitHub account
2. **Comment box** - A markdown-enabled text area for writing comments
3. **Comment list** - Shows all existing comments from the corresponding GitHub Discussion
4. **Reactions** - GitHub-style emoji reactions (👍 👎 😄 🎉 ❤️ 🚀 👀)
5. **Reply threads** - Nested comment threads for conversations
6. **Moderation tools** - Edit, delete, and manage comments (for repository owners)

### Visual Appearance

The widget automatically adapts to:
- **Light/Dark Mode**: Follows user's system preferences (`preferred_color_scheme`)
- **Mobile Responsive**: Works on all screen sizes
- **Site Styling**: The container has a dashed orange border matching your site's theme

### Example Comment Flow

1. **Visitor arrives at blog post** → Scrolls to bottom → Sees giscus widget
2. **Clicks "Sign in with GitHub"** → Redirected to GitHub OAuth → Approves giscus app
3. **Returns to blog post** → Widget now shows comment box with their GitHub profile
4. **Types comment in markdown** → Clicks "Comment" button
5. **Comment appears instantly** on blog AND in repository's GitHub Discussions
6. **Repository owner gets notified** via GitHub notifications

### Integration Points

- **Comments Widget**: Appears at the bottom of posts (after a dashed orange separator)
- **GitHub Discussions Tab**: All comments are stored as Discussion posts in the "Blog Comments" category
- **Notifications**: You receive GitHub notifications for new comments
- **Moderation**: Full GitHub Discussions moderation tools available

### Styling Details

The giscus section has custom styling that matches your site:

```css
.giscus-comments {
  margin-top: 3rem;           /* Space above the widget */
  padding-top: 2rem;          /* Padding inside the container */
  border-top: 2px dashed rgba(252, 76, 2, 0.15);  /* Orange dashed separator */
}
```

This creates a visual separation between blog content and comments, similar to your existing blog item separators.

### Features Available

✅ **Markdown Support**: Rich text formatting, code blocks, images, links
✅ **Emoji Reactions**: React to comments with GitHub emoji
✅ **Threading**: Reply to specific comments to create conversation threads
✅ **Edit/Delete**: Authors can edit or delete their own comments
✅ **Moderation**: Repository owners can moderate all comments
✅ **Notifications**: Get notified of new comments via GitHub
✅ **Search**: Comments are searchable in GitHub Discussions
✅ **Export**: All data stays in your repository - easy to export
✅ **Privacy**: No third-party tracking, no ads
✅ **Mobile Friendly**: Works on phones, tablets, and desktop

### What Visitors See (Step by Step)

#### Step 1: Unauthenticated View
When visitors first arrive, they see:
```
┌─────────────────────────────────────────┐
│  💬 Comments powered by giscus          │
│                                         │
│  [Sign in with GitHub to comment]      │
└─────────────────────────────────────────┘
```

#### Step 2: After Signing In
After authenticating with GitHub:
```
┌─────────────────────────────────────────┐
│  💬 Comments                            │
│                                         │
│  🧑 @username                          │
│  ┌─────────────────────────────────┐   │
│  │ Write a comment...              │   │
│  │ Markdown supported              │   │
│  └─────────────────────────────────┘   │
│  [Comment] [Preview]                   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  💬 @user1 commented 2 days ago        │
│  Great post! Thanks for sharing.       │
│  👍 3  💬 Reply                         │
│                                         │
│  💬 @user2 commented 1 day ago         │
│  Looking forward to more posts!        │
│  ❤️ 5  💬 Reply                         │
└─────────────────────────────────────────┘
```

### Comparison: Disqus vs giscus

| Feature | Disqus (Old) | giscus (New) |
|---------|--------------|--------------|
| **Backend** | Disqus servers | GitHub Discussions |
| **Privacy** | Tracking, ads | No tracking, no ads |
| **Authentication** | Multiple providers | GitHub only |
| **Data ownership** | Disqus | You (in your repo) |
| **Cost** | Free tier limited | Completely free |
| **Moderation** | Disqus dashboard | GitHub interface |
| **Export** | XML export | GitHub API |
| **Developer friendly** | ❌ | ✅ |
| **Open source** | ❌ | ✅ |

### Next Steps

1. Follow the setup instructions in `GISCUS_SETUP.md`
2. Enable GitHub Discussions on your repository
3. Install the giscus app
4. Get your configuration IDs
5. Update `_config.yml` with your IDs
6. Deploy to GitHub Pages
7. Test on a blog post!

---

**Note**: The giscus widget loads as an iframe, so it appears slightly isolated from your main page styling. This is intentional for security and performance. The widget automatically adapts to your site's color scheme.
