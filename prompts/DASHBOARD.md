# Dashboard

Summary: The dashboard will be the homepage of the application and the first page the user sees when they go to the banksy website. It will give them a quick overview of their accounts and balances along with a general spending trend line graph that displays the added amounts between all their accounts per day.

## Layout
The layout of the dashboard will be as follows starting from the top of the page. First section that is described is at the top and each subsequent section is stacked BELOW the section above it
1. Line graph
2. Next scheduled deposit
3. Account overview


## Requirements
All I want for this component right now is to create the skeleton. There will be no functional pieces created now I just want to get the components ready so that the functional pieces can be dropped in later
1. Line graph section
	- Nothing really needed right now other than reserving the top one quarter of the functional viewport (everything under the header)
2. Next scheduled deposit
	- This will be the size of the primereact message component and should reserve space for this
3. Accounts overview
	- This will take up the remaining space

The placement of these sections is based on the mobile view

On mobile, remove the divider between the header and body