# Astro Editor 

**As of right now this is 100% vibe coded** 

This is a project born of of frustration (headless CMS' are more hassle than they are worth for small blog / marketing sites). I migrated a website from a website away from a headless CMS service to Astro making use of MDX files. 
There still isn't a great way of managing content for these types of sites, so I decided to proceed with this idea of a desktop app for your Astro website. 

<img width="1512" height="1012" alt="Screenshot 2026-01-12 at 22 46 06" src="https://github.com/user-attachments/assets/752868c5-d5b2-4db0-b253-722308a2de3f" />

## Features 
- Open an Astro project to edit the content of the content directory.
- Recent Projects, will save projects (up to 10 right now) so you dont have to "reopen" on every launch
- Edit the markdown and preview it (preview is a lil flaky with MDX files)
- Edit the meta data associated with the markdown/mdx file
- create new files, should use the schema for the collection
- Run the Astro project from the editor (it will warn if you haven't install dependencies)

## initial todo list 

- Convert to typescript
- Clean up the React Code, as its trash.
- Improve the look & feel
- Improve the preview 
