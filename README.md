# travel_scraper

## Getting Started
1. Clone the respository
2. Make sure you have [Node](https://nodejs.org/en/download/package-manager) and npm installed
3. Run `npm install` in the router
4. Run `npm run scrape` in your terminal of choice and see the output of the scrape

## Next Steps
This is obviously a basic scraper that has hardcoded URLs - what would I do next?
- Have a DB where the scraped data can be stored for a User
- Turn the scraper into an asynchronous event driven function (Lambda or similar) that can be invoked via API and/or on a schedule
- This API call can send across the site to be scraped rather than the URLs being hardcoded
- Create a queue (SQS or similar) that feeds the scraping function so they can be handled asynchronously and in a scalable way
- IAC all the way
- Unit tests that run as part of CI/CD
- Github Actions for deploy
- Dockerised and Serverless all running offline (using serverless-offline & serverless-offline-sqs) for ease of setup
