import { PuppeteerCrawler, CommonPage } from 'crawlee';

type StringOrNull = string | null;
type Capacities = number[];
type Amenities = string[];
type ScrapeData = {
  title: string;
  property: string;
  bedrooms: number;
  bathrooms: number;
  amenities: Amenities;
};

const TITLE_SELECTOR = 'div[data-section-id="TITLE_DEFAULT"] h1';
const PROPERTY_SELECTOR = 'div[data-section-id="OVERVIEW_DEFAULT_V2"] h2';
const PROPERTY_DETAILS_SELECTOR =
  'div[data-section-id="OVERVIEW_DEFAULT_V2"] ol > li';
const AMENITIES_SELECTOR = 'div[data-section-id="AMENITIES_DEFAULT"] button';
const AMENITIES_MODAL_SELECTOR =
  'div[aria-label="What this place offers"] ul > li';
const WAIT_FOR_OPTIONS = { timeout: 10000 };

const validateTextContent = (text: string | null): string => {
  if (!text) {
    throw new Error('Element has no text content');
  }

  return text;
};

const getPropertyType = (text: StringOrNull): string => {
  const propertyType = validateTextContent(text)?.split(' in ')[0];

  if (!propertyType) {
    throw new Error('Cannot find property type');
  }

  return propertyType;
};

const getPropertyCapacities = (list: StringOrNull[]): Capacities => {
  const propertyCapacities = list.reduce<number[]>((capacities, text) => {
    const content = validateTextContent(text);

    if (content.includes('bedroom') || content.includes('bathroom')) {
      const capacity = content.trim().split(' ')[1];

      if (!capacity || isNaN(Number(capacity))) {
        throw new Error(`Invalid capacity type for content: ${content}`);
      }

      return [...capacities, Number(capacity)];
    }

    return capacities;
  }, []);

  if (propertyCapacities.length !== 2) {
    throw new Error(`Capacities not found`);
  }

  return propertyCapacities;
};

const getAmenities = (list: StringOrNull[]): Amenities => {
  return list.reduce<string[]>((amenities, text) => {
    const content = validateTextContent(text);
    if (content.startsWith('Unavailable:')) {
      return amenities;
    }
    return [...amenities, content];
  }, []);
};

const generateData = ([title, property, capacityList, amenitiesList]: [
  StringOrNull,
  StringOrNull,
  StringOrNull[],
  StringOrNull[]
]): ScrapeData => {
  const capacities = getPropertyCapacities(capacityList);
  return {
    title: validateTextContent(title),
    property: getPropertyType(property),
    bedrooms: capacities[0],
    bathrooms: capacities[1],
    amenities: getAmenities(amenitiesList),
  };
};

const crawl = async (urls: string[]) => {
  const crawler = new PuppeteerCrawler({
    requestHandlerTimeoutSecs: 30,
    maxRequestRetries: 2,
    async requestHandler({ page, request }) {
      try {
        // Check that all the required elements are on the page
        await Promise.all([
          page.waitForSelector(TITLE_SELECTOR, WAIT_FOR_OPTIONS),
          page.waitForSelector(PROPERTY_SELECTOR, WAIT_FOR_OPTIONS),
          page.waitForSelector(PROPERTY_DETAILS_SELECTOR, WAIT_FOR_OPTIONS),
          page.waitForSelector(AMENITIES_SELECTOR, WAIT_FOR_OPTIONS),
        ]);

        // Click to show the amenities modal
        page.$eval(AMENITIES_SELECTOR, (button) => button.click());
        // Wait until it shows
        await page.waitForSelector(AMENITIES_MODAL_SELECTOR, WAIT_FOR_OPTIONS);

        // Collect the text data from the page
        const siteData = await Promise.all([
          page.$eval(TITLE_SELECTOR, (el) => el.textContent),
          page.$eval(PROPERTY_SELECTOR, (el) => el.textContent),
          page.$$eval(PROPERTY_DETAILS_SELECTOR, (list) =>
            list.map((el) => el.textContent)
          ),
          page.$$eval(AMENITIES_MODAL_SELECTOR, (list) =>
            list.map((el) => el.textContent)
          ),
        ]);

        console.log(`Details for property ${request.url}:`);
        console.dir(generateData(siteData));
      } catch (err) {
        console.error(`Failed to crawl page: ${request.url} - ${err}`);
      }
    },
  });

  await crawler.run(urls);
};

crawl([
  'https://www.airbnb.co.uk/rooms/33571268',
  'https://www.airbnb.co.uk/rooms/20669368',
  'https://www.airbnb.co.uk/rooms/50633275',
]);
