# Architecture update

Summary: We need to update the architecture file to reflect the build patterns I want to establish. This file will give you all the information you need to know in order to build each page's view to fit the screens it will be used on

## Primary screens
This application will primarily be used on 4 mobile screens and must adjust to fit a computer browser screen.

The 4 mobile devices with their screen sizes are:
	1: Google Pixel 10 - 412x924
	2: iPhone 17 - 402x874
	3: iPhone 14 - 390x844
	4: Samsung Galaxy S25+ - 412x891

IMPORTANT: These screen sizes must ALWAYS display all content optimally even if desktop views must compromise

The only large screen size we have to worry about is anything 1024px and larger

IMPORTANT: Screen WIDTHS in between the largest HEIGHT of the listed devices (Google Pixel 10 at 924px) are irrelivant and do not need to be accommodated. I say height because the user should be able to use landscape mode comfortably

## Patterns
We will use a mobile first approach so breakpoints must be created with a min-width and up pattern. Screens smaller than the smallest device I have listed (any under 390px wide) are irrelivant to this application as are sizes in between the largest height of the listed devices and 1024px.

We will develop all screen views with the intention to eliminate as much scrolling as possible while still maintaining reasonable margins and paddings to avoid a cramped UI. We will also enforce WCAG 2.0 touch point size requirements on all interactable features.

As an SPA, all views must be rendered within the Layout component to ensure proper layout and spacing (this component does not exist yet so write about it as if it has been created). To keep everything simple, we will start operating with a single column grid for the mobile devices and 2 columns for desktop devices within the layout component's body section

## Tasks
After reading this please ask clarifying questions if you have any and suggest any other patterns that will make this application have a better user experience. These suggestions must be limited to only patterns that will enhance the user experience.

Once I answer your questions and have approved any suggested patterns or updates to this plan, you have these 2 tasks:
	1. Document the mobile first development rules within ARCHITECTURE.md
	2. Create a sass map in variables.scss called $breakpoints that contain all the screen size breakpoints.
	3. Update the application to use PrimeReact's Lara Light-blue theme (we will support the light blue theme in both light mode and dark mode with light mode being the default)
	4. Update the index.scss to import necessary style sheets from primereact to use their component and theme styles
