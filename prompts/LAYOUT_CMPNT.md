# Layout Component

Summary: This is a container that will wrap the entire application and will enforce and maintain consistent formatting, style, spacing, accessibility, and grid accross all available pages

Requirements:
1. Sidebar. This should have all the navigation using primereacts menu component. This is ONLY present on mobile views
	- This will slide in and out from the left of the screen and the standard hamburger menu icon should be the slide in/out trigger
	- Hamburger menu goes at the top left of the mobile viewport
	- Sidebar content can be placeholders for now
	- Mobile sidebar design:
		i. Top of sliding sidebar should have user icon from primeicons followed by the logged in user's first and last name
			[UserIcon] [FirstName LastName]
		ii. Under that should be the primereact divider
		iii. Under the divider should be the list of navigation items
		iv. Hamburger menu button should slide out alongside the sliding sidebar menu and the hamburger icon should change to an x icon
			a. Clicking the x icon should slide the menu back off screen. Touching outside of the menu should also close the menu
		v. At the bottom of the slide out menu in <small> Should say the Banksy all rights reserved with the copyright symbol. This should be centered and ALWAYS remain on the bottom
2. App Header. This will have a different design for mobile vs desktop and will be fairly minimalistic
	- Mobile header design
		i. Header will be one single row
		ii. Left aligned will be the hamburger menu icon button that will expand and collapse the sliding sidebar nav menu
		iii. To the right of the hamburger menu (2rem left margin) will be the Banksy app logo contained in src/assets/banksy-app-logo.png. When clicked, it will redirect the user to the home page
		iv. Right aligned will be a primereact primary pill button with 2 states
			a. State 1: This us the 'user is logged out' state. When a user is not logged in this button will read Login. When clicked it will call the `/api/auth/me` endpoint and allow the user to log in and proceed through the OAuth flow
			b. State 2: This will be the 'user is logged in' state. When a user is logged in this button will read Logout. When clicked it will call the `/api/auth/logout` endpoint and allow the user to log out and proceed through the OAuth flow
		v. After a successful login or logout, the login/logout button should update with the appropriate label
	- Desktop header design
		i. Header will be one single row
		ii. Left aligned will be the Banksy logo located in src/assets/banksy-logo.png. When clicked it will redirect the user to the home page. I believe that it should utilize a button element for accessibility purposes but you are permitted to use whatever element enforces our accessibility standards
		iii. Centered will be the navigation menu utilizing the primereact menubar
			a. use the start prop of the menubar to add the banksy app logo located in `src/assets/banksy-app-logo`
		iv. Right aligned will be the user information section and will contain user information along with a login/logout button
			a. User information section:
				a-1. If a user is logged in, display the words Welcome [FirstName LastName]!
				a-2. If no user is logged in display nothing
			b. Login/logout button should be displayed to the right of the user section (1rem gap between elements). Login/logout button should have the same behavior as described in section 2 - Mobile Header Design - iv-a and b
		v. I would like the desktop header's nav menu to appear as a floating pill shape. Please round the left and right sides of the primereact menubar component and add a box shadow to the component to give the floating appearance
		vi. Primereact should handle accessibility and keyboard support, the only thing you need to do for accessibility is make sure the content within the start prop is included within the tab order and has an effective aria to allow screen readers to properly announce that it is the Banksy logo and will redirect the user to the home page if clicked
3. Body. This section should be used to display the current page
	- The content provided to this section should ALWAYS be wrapped in ALL context providers with the exception of the Auth provider
		a. render (
				<ContextProvider>
					...(more context providers)
						{children}
				</ContextProvider>
			)
		b. Auth Provider belongs in App.tsx and should be wrapping the layout component
	- The body should enforce the grid system of one column on mobile and 2 on desktop
4. HTML Heirarchy
	- When designing this component, you MUST account for accessibility and HTML heirarchy
	- Whether the H1 is contained in the header or body is your decision but MUST remain consistent across all views and any new page rendered in the layout component's body MUST adhere to that heirarchy

Upon application load, this component must load the home page in the body by default. For now, just pass a placeholder home page. DO NOT create a placeholder homepage component, just pass in a placeholder element

After reading this prompt, please ask me any questions you need to and make any suggestions you have that will improve design or user experience. As per development hooks, you may only begin development when you have my explicit permission to do so after creating the necessary planning documents.
