"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const crawlee_1 = require("crawlee");
const TITLE_SELECTOR = 'div[data-section-id="TITLE_DEFAULT"] h1';
const PROPERTY_SELECTOR = 'div[data-section-id="OVERVIEW_DEFAULT_V2"] h2';
const PROPERTY_DETAILS_SELECTOR = 'div[data-section-id="OVERVIEW_DEFAULT_V2"] ol > li';
const AMENITIES_SELECTOR = 'div[data-section-id="AMENITIES_DEFAULT"] button';
const AMENITIES_MODAL_SELECTOR = 'div[aria-label="What this place offers"] ul > li';
const WAIT_FOR_OPTIONS = { timeout: 10000 };
const getTextContent = (el) => {
    if (!el.textContent) {
        throw new Error('Element has no text content');
    }
    return el.textContent;
};
const getPropertyType = (el) => {
    var _a;
    const propertyType = (_a = getTextContent(el)) === null || _a === void 0 ? void 0 : _a.split(' in ')[0];
    if (!propertyType) {
        throw new Error('Cannot find property type');
    }
    return propertyType;
};
const getPropertyCapacities = (list) => {
    const propertyCapacities = list.reduce((capacities, el) => {
        const content = getTextContent(el);
        if (content.includes('bedroom') || content.includes('bathroom')) {
            const capacity = content.trim().split(' ')[1];
            if (!capacity || isNaN(Number(capacity))) {
                throw new Error(`Invalid capacity type for content: ${content}`);
            }
            return [...capacities, Number(capacity)];
        }
        return capacities;
    }, []);
    if (propertyCapacities.length === 2) {
        throw new Error(`Capacities not found`);
    }
    return propertyCapacities;
};
const getAmenities = (list) => {
    return list.reduce((amenities, el) => {
        const content = getTextContent(el);
        if (content.startsWith('Unavailable:')) {
            return amenities;
        }
        return [...amenities, content];
    }, []);
};
const crawl = (urls) => __awaiter(void 0, void 0, void 0, function* () {
    const crawler = new crawlee_1.PuppeteerCrawler({
        requestHandlerTimeoutSecs: 30,
        requestHandler(_a) {
            return __awaiter(this, arguments, void 0, function* ({ page, request }) {
                try {
                    // Check that all the required elements are on the page
                    yield Promise.all([
                        page.waitForSelector(TITLE_SELECTOR, WAIT_FOR_OPTIONS),
                        page.waitForSelector(PROPERTY_SELECTOR, WAIT_FOR_OPTIONS),
                        page.waitForSelector(PROPERTY_DETAILS_SELECTOR, WAIT_FOR_OPTIONS),
                        page.waitForSelector(AMENITIES_SELECTOR, WAIT_FOR_OPTIONS),
                    ]);
                    // Click to show the amenities modal
                    page.$eval(AMENITIES_SELECTOR, (button) => button.click());
                    // Wait until it shows
                    yield page.waitForSelector(AMENITIES_MODAL_SELECTOR, WAIT_FOR_OPTIONS);
                    const [title, propertyType, [bedrooms, bathrooms], amenities] = yield Promise.all([
                        page.$eval(TITLE_SELECTOR, getTextContent),
                        page.$eval(PROPERTY_SELECTOR, getPropertyType),
                        page.$$eval(PROPERTY_DETAILS_SELECTOR, getPropertyCapacities),
                        page.$$eval(AMENITIES_MODAL_SELECTOR, getAmenities),
                    ]);
                    console.log(`Details for property ${request.url}:`);
                    console.dir({
                        title,
                        propertyType,
                        bedrooms,
                        bathrooms,
                        amenities,
                    });
                }
                catch (err) {
                    console.error(`Failed to crawl page: ${request.url} - ${err}`);
                }
            });
        },
    });
    yield crawler.run(urls);
});
crawl([
    'https://www.airbnb.co.uk/rooms/33571268',
    'https://www.airbnb.co.uk/rooms/20669368',
    'https://www.airbnb.co.uk/rooms/50633275',
]);
