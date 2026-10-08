/** TEMPORARY — replicates the /products browser predicate to verify filter counts. */
import {
  catalogueCategories,
  catalogueProducts,
  toBrowserCategories,
} from "../src/lib/catalogue";
import {
  collectApplications,
  collectIndustries,
  collectProductTypes,
  getProductSearchText,
  getProductTypeLabel,
} from "../src/lib/catalogue-shared";

const products = catalogueProducts;
const categories = toBrowserCategories(catalogueCategories);

type State = {
  query: string;
  category: string;
  application: string;
  industry: string;
  productType: string;
  featuredOnly: boolean;
  sort: "featured" | "az";
};

const ALL = "all";

const initialState: State = {
  query: "",
  category: ALL,
  application: ALL,
  industry: ALL,
  productType: ALL,
  featuredOnly: false,
  sort: "featured",
};

/** Current (buggy) predicate as shipped. */
function filterCurrent(productsList: typeof catalogueProducts, state: State) {
  const normalizedQuery = state.query.trim().toLowerCase();
  return productsList.filter((product) => {
    if (state.category && product.category !== state.category) return false;
    if (state.application !== ALL && !product.applications.includes(state.application)) return false;
    if (state.industry !== ALL && !product.industries.includes(state.industry)) return false;
    if (state.productType !== ALL && getProductTypeLabel(product) !== state.productType) return false;
    if (state.featuredOnly && !product.featured) return false;
    if (!normalizedQuery) return true;
    return getProductSearchText(product).includes(normalizedQuery);
  });
}

/** Fixed predicate: an All/empty value is no restriction. */
function filterFixed(productsList: typeof catalogueProducts, state: State) {
  const normalizedQuery = state.query.trim().toLowerCase();
  const isAll = (value: string | null | undefined) => !value || value === ALL;
  return productsList.filter((product) => {
    if (!isAll(state.category) && product.category !== state.category) return false;
    if (!isAll(state.application) && !product.applications.includes(state.application)) return false;
    if (!isAll(state.industry) && !product.industries.includes(state.industry)) return false;
    if (!isAll(state.productType) && getProductTypeLabel(product) !== state.productType) return false;
    if (state.featuredOnly && !product.featured) return false;
    if (!normalizedQuery) return true;
    return getProductSearchText(product).includes(normalizedQuery);
  });
}

const applications = collectApplications(products);
const industries = collectIndustries(products);
const productTypes = collectProductTypes(products);

console.log(`products=${products.length} categories=${categories.length} applications=${applications.length} industries=${industries.length} productTypes=${productTypes.length}`);
console.log(`distinct product.category values: ${JSON.stringify(Array.from(new Set(products.map((p) => p.category))))}`);
console.log(`current initial => ${filterCurrent(products, initialState).length} visible`);
console.log(`fixed   initial => ${filterFixed(products, initialState).length} visible`);

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) failures += 1;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label} => ${JSON.stringify(actual)}`);
};

// Fixed behaviour: initial render shows everything.
check("fixed initial shows all", filterFixed(products, initialState).length, products.length);

// Every category option.
for (const category of [ALL, ...categories.map((c) => c.slug)]) {
  const state = { ...initialState, category };
  const visible = filterFixed(products, state);
  const expected =
    category === ALL ? products.length : products.filter((p) => p.category === category).length;
  check(`category=${category}`, visible.length, expected);
}

// Every application option (sampled totals must be > 0 and <= total).
for (const application of applications) {
  const state = { ...initialState, application };
  const visible = filterFixed(products, state);
  const expected = products.filter((p) => p.applications.includes(application)).length;
  check(`application=${application}`, visible.length, expected);
}

// Every industry option.
for (const industry of industries) {
  const state = { ...initialState, industry };
  const visible = filterFixed(products, state);
  const expected = products.filter((p) => p.industries.includes(industry)).length;
  check(`industry=${industry}`, visible.length, expected);
}

// Every product type option.
for (const productType of productTypes) {
  const state = { ...initialState, productType };
  const visible = filterFixed(products, state);
  const expected = products.filter((p) => getProductTypeLabel(p) === productType).length;
  check(`productType=${productType}`, visible.length, expected);
}

// Featured only on / off.
check("featuredOnly=true", filterFixed(products, { ...initialState, featuredOnly: true }).length, products.filter((p) => p.featured).length);
check("featuredOnly=false", filterFixed(products, initialState).length, products.length);

// Search: a known product name narrows, clearing restores.
const probe = products[0];
const searchHits = filterFixed(products, { ...initialState, query: probe.name.toLowerCase() });
check(`search narrows for "${probe.name}"`, searchHits.length > 0 && searchHits.length < products.length, true);
check("cleared search restores all", filterFixed(products, initialState).length, products.length);

// Sorting keeps the full set.
const az = [...filterFixed(products, initialState)].sort((a, b) => a.name.localeCompare(b.name));
check("A-Z keeps every product", az.length, products.length);

// Reset (all All + featured false) returns the complete catalogue.
const reset: State = { query: "", category: ALL, application: ALL, industry: ALL, productType: ALL, featuredOnly: false, sort: "featured" };
check("reset returns complete catalogue", filterFixed(products, reset).length, products.length);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
