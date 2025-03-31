var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const createElement = (tag, { children, ...props } = {}) => {
  const element = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key in element) {
      element[key] = value;
      return;
    }
    if (!(key in element)) {
      element.setAttribute(key, value);
    }
  });
  if (children) {
    element.append(...children);
  }
  return element;
};
const Img = ({
  width = "",
  height = "",
  src,
  classList,
  props
}) => {
  const imgElement = createElement("img", {
    width,
    height,
    src,
    ...props
  });
  if (classList && classList.length > 0) {
    imgElement.classList.add(...classList);
  }
  return imgElement;
};
const Text = ({ classList, props }) => {
  const textElement = createElement("p", props);
  if (classList && classList.length > 0) {
    textElement.classList.add(...classList);
  }
  return textElement;
};
const Footer = () => {
  return createElement("footer", {
    classList: "footer",
    children: [
      Text({
        props: { textContent: "© 우아한테크코스 All Rights Reserved." }
      }),
      Img({
        width: "180",
        height: "30",
        src: "./images/woowacourse_logo.png"
      })
    ]
  });
};
const ENV = {
  VITE_API_URL: "https://api.themoviedb.org/3/",
  VITE_TMDB_HEADER: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MjcwMTM3OTE2ZTUzYmI1Mjg2MzUyYmU3YWJjNTUyMiIsIm5iZiI6MTY4MzU0ODQ0OS4wNDQ5OTk4LCJzdWIiOiI2NDU4ZTkyMTc3ZDIzYjAxNzAzNzU1YmUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.QDQQ7HEqgZhnaF7yOGSJ1l7JVQvV1pKL3Go9BtvEVoA"
};
const STATUS_MESSAGE = {
  400: `요청에 문제가 있어요
입력하신 정보를 확인하고 다시 시도해 주세요.`,
  401: `로그인이 필요해요
로그인 후 다시 시도해 주세요.`,
  403: `접근 권한이 없어요
다른 계정으로 로그인하거나 관리자에게 문의해 주세요.`,
  404: `찾으시는 정보가 없어요
주소를 확인하시거나 다른 검색어로 시도해 보세요.`,
  422: `입력하신 정보에 문제가 있어요
입력 값을 확인하고 다시 시도해 주세요.`,
  429: `잠시 후에 다시 시도해 주세요
짧은 시간 내에 너무 많은 요청이 발생했습니다.`,
  500: `일시적인 서버 오류가 발생했어요
잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 문의해 주세요.`,
  501: `지원하지 않는 기능이에요
다른 방법을 시도하거나 나중에 다시 확인해 주세요.`,
  502: `일시적인 서버 연결 문제가 발생했어요
잠시 후 다시 시도해 주세요.`,
  503: `서비스 점검 중이에요
잠시 후에 다시 접속해 주세요.`,
  504: `서버 응답 시간이 너무 오래 걸려요
인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요.`
};
class HttpError extends Error {
  constructor(status) {
    if (!Object.hasOwnProperty.call(STATUS_MESSAGE, status)) {
      throw new Error(`에러가 발생했어요. ${status}`);
    }
    super(STATUS_MESSAGE[status]);
    __publicField(this, "status");
  }
}
class Fetcher {
  constructor(baseUrl) {
    __publicField(this, "baseUrl");
    __publicField(this, "currentController", []);
    this.baseUrl = baseUrl;
  }
  async get(url) {
    this.cleanUp();
    const curHttpCtrl = new AbortController();
    const response = await fetch(`${this.baseUrl}/${url}`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${ENV.VITE_TMDB_HEADER}`
      },
      method: "GET",
      signal: curHttpCtrl.signal
    });
    if (!response.ok) {
      throw new HttpError(response.status);
    }
    return response.json();
  }
  cleanUp() {
    this.currentController.forEach((abortCtrl) => abortCtrl.abort());
  }
}
class MovieFetcherEvent {
  constructor() {
    __publicField(this, "listeners", []);
  }
  subscribe(listener) {
    this.listeners.push(listener);
    return () => this.unsubscribe(listener);
  }
  unsubscribe(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
  notify() {
    this.listeners.forEach((listener) => listener());
  }
}
const movieFetcherEvent = new MovieFetcherEvent();
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const API_PATHS = {
  MOVIE: "movie/popular",
  SEARCH: "search/movie",
  DETAIL: "movie"
};
class MovieFetcher {
  constructor() {
    __publicField(this, "movieFetcher");
    __publicField(this, "isLoading", false);
    __publicField(this, "isSearch", false);
    __publicField(this, "query", "");
    __publicField(this, "currentPage", 1);
    __publicField(this, "movieResponse", {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0
    });
    __publicField(this, "movieResult", []);
    __publicField(this, "error", null);
    this.movieFetcher = new Fetcher(ENV.VITE_API_URL);
  }
  async fetchMovieData(url) {
    this.isLoading = true;
    this.error = null;
    movieFetcherEvent.notify();
    try {
      const response = await this.movieFetcher.get(url);
      await delay(1e3);
      this.updateMovieData(response);
      this.isLoading = false;
      movieFetcherEvent.notify();
      return response;
    } catch (error) {
      this.isLoading = false;
      this.error = error;
      movieFetcherEvent.notify();
    }
  }
  updateMovieData(response) {
    this.movieResponse = response;
    this.movieResult = [...this.movieResult, ...response.results];
  }
  async getPopularMovies(page) {
    this.isSearch = false;
    this.currentPage = page;
    const url = `${API_PATHS.MOVIE}?page=${page}`;
    return await this.fetchMovieData(url);
  }
  async getNextPagePopularMovies() {
    await this.getPopularMovies(this.currentPage + 1);
  }
  async getSearchMovies(page, query) {
    this.movieResult = [];
    this.isSearch = true;
    this.currentPage = page;
    this.query = query;
    const url = `${API_PATHS.SEARCH}?query=${query}&page=${page}`;
    return await this.fetchMovieData(url);
  }
  async getNextPageSearchMovies() {
    await this.getSearchMovies(this.currentPage + 1, this.query);
  }
  async getMovieDetail(movieId) {
    try {
      const url = `${API_PATHS.DETAIL}/${movieId}?language=ko-KR`;
      return await this.movieFetcher.get(url);
    } catch (error) {
      throw error;
    }
  }
  get movies() {
    return this.movieResult ?? [];
  }
  get isLoadingState() {
    return this.isLoading;
  }
  get isSearchState() {
    return this.isSearch;
  }
  get currentMovieResponse() {
    return this.movieResponse;
  }
  get queryText() {
    return this.query;
  }
  get errorState() {
    return this.error;
  }
}
const movieFetcher = new MovieFetcher();
const Box = ({ classList, props }) => {
  const boxElement = createElement("div", props);
  if (classList && classList.length > 0) {
    boxElement.classList.add(...classList);
  }
  return boxElement;
};
const Button = ({
  type = "button",
  height = "36",
  onClick,
  classList,
  props
}) => {
  const buttonElement = createElement("button", {
    type,
    ...props
  });
  if (classList && classList.length > 0) {
    buttonElement.classList.add(...classList);
  }
  if (height) {
    buttonElement.style.height = `${height}px`;
  }
  buttonElement.addEventListener("click", onClick);
  return buttonElement;
};
const IconButton = ({
  width,
  height,
  src,
  onClick,
  classList = [],
  props = {}
}) => {
  return Button({
    type: "button",
    onClick,
    classList: ["border-none", ...classList],
    props: {
      ...props,
      children: [Img({ width, height, src })]
    }
  });
};
const SearchBar = ({ onSubmit, classList, props }) => {
  const input = createElement("input", {
    classList: "search-input",
    type: "text",
    placeholder: "검색어를 입력해주세요."
  });
  const iconBtn = IconButton({
    width: "16",
    height: "16",
    src: "images/search.png",
    onClick: () => onSubmit(input.value),
    classList,
    props
  });
  const formElement = createElement("form", {
    ...props,
    classList: "form-container",
    children: [input, iconBtn]
  });
  formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(input.value);
  });
  return formElement;
};
const createHeaderSection = () => {
  return createElement("section", {
    classList: "section-container",
    children: [
      IconButton({
        width: "117",
        height: "20",
        src: "./images/logo.png",
        classList: ["logo"],
        onClick: () => {
          window.location.reload();
        },
        props: { alt: "MovieLogo" }
      }),
      SearchBar({
        classList: ["search-bar"],
        onSubmit: async (value) => {
          var _a, _b, _c;
          (_a = document.querySelector(".top-rated-movie")) == null ? void 0 : _a.replaceChildren();
          (_b = document.querySelector(".overlay")) == null ? void 0 : _b.classList.add("hidden");
          (_c = document.querySelector(".background-container")) == null ? void 0 : _c.classList.add("search-header-container");
          await movieFetcher.getSearchMovies(1, value);
        }
      })
    ]
  });
};
const createRatingSection$2 = () => {
  return Box({
    classList: ["rate"],
    props: {
      children: [
        Img({ width: "32", height: "32", src: "./images/star_empty.png" }),
        Text({
          classList: ["text-2xl", "font-semibold", "text-yellow"],
          props: { textContent: "9.5" }
        })
      ]
    }
  });
};
const createFeaturedMovieSection = () => {
  return Box({
    classList: ["top-rated-movie"],
    props: {
      children: [
        createRatingSection$2(),
        Text({
          classList: ["text-3xl", "font-semibold"],
          props: { textContent: "인사이드 아웃2" }
        }),
        Button({
          type: "button",
          onClick: () => {
          },
          classList: ["primary", "detail"],
          props: { textContent: "자세히 보기" }
        })
      ]
    }
  });
};
const createBackgroundContainer = () => {
  return Box({
    classList: ["background-container"],
    props: {
      children: [
        Box({
          classList: ["overlay"],
          props: {
            "aria-hidden": "true"
          }
        }),
        Box({
          classList: ["top-rated-container"],
          props: {
            children: [createHeaderSection(), createFeaturedMovieSection()]
          }
        })
      ]
    }
  });
};
const Header = () => {
  var _a;
  const headerElement = createElement("header", {
    children: [createBackgroundContainer()]
  });
  (_a = document.querySelector("#app")) == null ? void 0 : _a.appendChild(headerElement);
  return headerElement;
};
const STORAGE_KEY = "movie_ratings";
const saveMovieRating = (movieId, rating) => {
  try {
    const currentRatings = getMovieRatings();
    const existingIndex = currentRatings.findIndex(
      (item) => item.movieId === movieId
    );
    if (existingIndex >= 0) {
      currentRatings[existingIndex].rating = rating;
    } else {
      currentRatings.push({ movieId, rating });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentRatings));
  } catch (error) {
    console.error(error);
  }
};
const getMovieRating = (movieId) => {
  try {
    const currentRatings = getMovieRatings();
    const ratingItem = currentRatings.find((item) => item.movieId === movieId);
    return ratingItem ? ratingItem.rating : 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
const getMovieRatings = () => {
  try {
    const ratingsJson = localStorage.getItem(STORAGE_KEY);
    if (!ratingsJson) {
      return [];
    }
    return JSON.parse(ratingsJson);
  } catch (error) {
    console.error(error);
    return [];
  }
};
const getRatingText = (rating) => {
  let str = ` (${rating}/10)`;
  switch (rating) {
    case 2:
      return "최악이예요" + str;
    case 4:
      return "별로예요" + str;
    case 6:
      return "보통이에요" + str;
    case 8:
      return "재미있어요" + str;
    case 10:
      return "명작이에요" + str;
    default:
      return "";
  }
};
const IMAGE_BASE_URL$1 = "https://image.tmdb.org/t/p/original";
const DEFAULT_IMAGE_URL$1 = "./images/no_image.png";
const createCloseButton$1 = () => {
  return createElement("button", {
    className: "close-modal",
    id: "closeModal",
    children: [
      createElement("img", {
        src: "./images/modal_button_close.png"
      })
    ]
  });
};
const createImageSection = (movie) => {
  const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL$1}${movie.poster_path}` : DEFAULT_IMAGE_URL$1;
  return createElement("div", {
    className: "modal-image",
    children: [
      createElement("img", {
        src: posterUrl,
        alt: movie.title
      })
    ]
  });
};
const createRatingSection$1 = (average) => {
  return createElement("p", {
    className: "rate",
    children: [
      createElement("img", {
        src: "./images/star_filled.png",
        className: "star"
      }),
      createElement("span", {
        textContent: average.toFixed(1)
      })
    ]
  });
};
const createMyRatingSection = (movieId) => {
  const savedRating = getMovieRating(movieId);
  const ratingText = getRatingText(savedRating);
  const starContainer = createElement("div", {
    className: "star-container"
  });
  const ratingLabel = createElement("span", {
    className: "rating-text",
    textContent: ratingText
  });
  for (let starValue = 2; starValue <= 10; starValue += 2) {
    const isFilled = savedRating >= starValue;
    const starImg = createElement("img", {
      src: isFilled ? "./images/star_filled.png" : "./images/star_empty.png",
      className: "star"
    });
    const starButton = createElement("button", {
      className: "rating-star",
      children: [starImg]
    });
    starButton.addEventListener("click", () => {
      saveMovieRating(movieId, starValue);
      const stars = starContainer.querySelectorAll(".rating-star img");
      stars.forEach((star, index) => {
        const starImg2 = star;
        starImg2.src = index * 2 < starValue ? "./images/star_filled.png" : "./images/star_empty.png";
      });
      ratingLabel.textContent = getRatingText(starValue);
    });
    starContainer.append(starButton, ratingLabel);
  }
  return createElement("div", {
    className: "my-rating",
    children: [
      createElement("div", {
        className: "rating-header",
        children: [
          createElement("p", {
            className: "rating-label",
            textContent: "내 별점"
          })
        ]
      }),
      starContainer,
      createElement("hr")
    ]
  });
};
const createCategoryText = (movie) => {
  const year = movie.release_date ? movie.release_date.split("-")[0] : "";
  let categories = "";
  if (movie.genres && movie.genres.length > 0) {
    categories = movie.genres.map((genre) => genre.name).join(", ");
  }
  return `${year}${categories ? " · " + categories : ""}`;
};
const createDescriptionSection$1 = (movie) => {
  return createElement("div", {
    className: "modal-description",
    children: [
      createElement("h2", {
        textContent: movie.title
      }),
      createElement("p", {
        className: "category",
        textContent: createCategoryText(movie)
      }),
      createRatingSection$1(movie.vote_average),
      createElement("hr"),
      createMyRatingSection(movie.id),
      createElement("div", {
        className: "subtitle",
        textContent: "줄거리"
      }),
      createElement("p", {
        className: "detail",
        textContent: movie.overview || "줄거리가 없습니다"
      })
    ]
  });
};
const createModalContainer = (imageSection, descriptionSection) => {
  return createElement("div", {
    className: "modal-container",
    children: [imageSection, descriptionSection]
  });
};
const createModal = (closeButton, modalContainer) => {
  return createElement("div", {
    className: "modal",
    children: [closeButton, modalContainer]
  });
};
const MovieDetailModal = (movie) => {
  const closeButton = createCloseButton$1();
  const imageSection = createImageSection(movie);
  const descriptionSection = createDescriptionSection$1(movie);
  const modalContainer = createModalContainer(imageSection, descriptionSection);
  const modal = createModal(closeButton, modalContainer);
  const modalBackground = createElement("div", {
    className: "modal-background active",
    id: "modalBackground",
    children: [modal]
  });
  const closeModal = () => {
    modalBackground.classList.remove("active");
    setTimeout(() => {
      modalBackground.remove();
      document.body.style.overflow = "";
    }, 300);
  };
  closeButton.addEventListener("click", closeModal);
  modalBackground.addEventListener("click", (event) => {
    if (event.target === modalBackground) {
      closeModal();
    }
  });
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  return modalBackground;
};
const openModal = (movie) => {
  const detailModal = MovieDetailModal(movie);
  document.body.appendChild(detailModal);
  document.body.style.overflow = "hidden";
  return detailModal;
};
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w220_and_h330_face";
const DEFAULT_IMAGE_URL = "./images/no_image.png";
const createLoadingView = () => {
  return createElement("div", {
    className: "modal-loading",
    children: [
      createElement("p", {
        className: "loading-text",
        textContent: "영화 정보를 불러오는 중..."
      })
    ]
  });
};
const createCloseButton = () => {
  return createElement("button", {
    className: "close-modal",
    id: "closeModal",
    children: [
      createElement("img", {
        src: "./images/modal_button_close.png"
      })
    ]
  });
};
const createBaseModal = (content) => {
  const closeButton = createCloseButton();
  const modal = createElement("div", {
    className: "modal",
    children: [closeButton, content]
  });
  const modalBackground = createElement("div", {
    className: "modal-background active",
    id: "modalBackground",
    children: [modal]
  });
  closeButton.addEventListener("click", () => {
    modalBackground.classList.remove("active");
    setTimeout(() => {
      modalBackground.remove();
      document.removeEventListener("keydown", handleKeyDown);
    }, 300);
  });
  modalBackground.addEventListener("click", (e) => {
    if (e.target === modalBackground) {
      closeButton.click();
    }
  });
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      closeButton.click();
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  return modalBackground;
};
const createRatingSection = (vote_average) => {
  return Box({
    classList: ["movie-rate"],
    props: {
      children: [
        Img({
          width: "16",
          height: "16",
          src: "./images/star_empty.png"
        }),
        Text({
          classList: ["text-lg", "font-semibold", "text-yellow"],
          props: {
            textContent: `${vote_average}`
          }
        })
      ]
    }
  });
};
const createDescriptionSection = (title, vote_average) => {
  return Box({
    classList: ["movie-description"],
    props: {
      children: [
        createRatingSection(vote_average),
        Text({
          classList: ["text-xl", "font-bold"],
          props: {
            textContent: title
          }
        })
      ]
    }
  });
};
const createMovieImage = (title, poster_path) => {
  return Img({
    src: poster_path ? `${IMAGE_BASE_URL}${poster_path}` : DEFAULT_IMAGE_URL,
    classList: ["thumbnail"],
    props: {
      alt: title
    }
  });
};
const MovieItem = (movie) => {
  const { title, vote_average, poster_path, id } = movie;
  const movieItem = createElement("li", {
    classList: "movie-item",
    children: [
      createMovieImage(title, poster_path),
      createDescriptionSection(title, vote_average)
    ]
  });
  movieItem.addEventListener("click", async () => {
    const loadingView = createLoadingView();
    const modalBackground = createBaseModal(loadingView);
    document.body.appendChild(modalBackground);
    const movieDetail = await movieFetcher.getMovieDetail(id);
    document.body.removeChild(modalBackground);
    openModal(movieDetail);
  });
  return movieItem;
};
const createPosterSkeleton = () => {
  return Box({
    classList: ["skeleton-animation", "poster-skeleton"]
  });
};
const createTitleSkeleton = () => {
  return Box({
    classList: ["skeleton-animation", "title-skeleton"]
  });
};
const createDateSkeleton = () => {
  return Box({
    classList: ["skeleton-animation", "date-skeleton"]
  });
};
const MovieSkeleton = () => {
  return createElement("li", {
    classList: "movie-item skeleton-item",
    children: [
      createPosterSkeleton(),
      createTitleSkeleton(),
      createDateSkeleton()
    ]
  });
};
const Empty = () => {
  return Box({
    classList: ["result-container"],
    props: {
      children: [
        Img({
          width: "72",
          height: "62",
          src: "./images/dizzy_planet.png"
        }),
        Text({
          classList: ["text-2xl", "font-semibold", "mt-24"],
          props: { textContent: "검색 결과가 없습니다." }
        })
      ]
    }
  });
};
let isLoading = false;
let hasMorePages = true;
let observer = null;
let prevSearchQuery = "";
let isFirstSearch = true;
const renderErrorState = () => {
  const error = movieFetcher.errorState;
  if (!error) return;
  titleText.style.display = "none";
  movieUl.style.display = "none";
  const errorContainer = createElement("div", {
    classList: "error-container"
  });
  const errorMessage = Text({
    classList: ["text-2xl", "font-bold"],
    props: {
      textContent: error.message || "영화 정보를 불러오는 중 오류가 발생했습니다."
    }
  });
  errorContainer.append(errorMessage);
  sectionElement.insertBefore(errorContainer, movieUl);
};
const createMovieItems = (movies) => {
  return movies.map((movie) => MovieItem(movie));
};
const updateListTitle = (titleElement, isSearch, query) => {
  titleElement.textContent = isSearch ? `검색 결과: ${query}` : "지금 인기 있는 영화";
};
const observerTarget = Text({
  classList: ["w-full", "mt-20"]
});
const titleText = Text({
  classList: ["text-2xl", "font-bold", "mb-32"],
  props: { textContent: "지금 인기 있는 영화" }
});
const movieUl = createElement("ul", {
  classList: "thumbnail-list"
});
const sectionElement = createElement("section", {
  classList: "container",
  children: [titleText, movieUl, observerTarget]
});
const mainElement = createElement("main", {
  children: [sectionElement]
});
const createSkeletonItems = (count = 20) => {
  return Array.from({ length: count }, () => {
    const skeleton = MovieSkeleton();
    skeleton.classList.add("next-page-skeleton");
    return skeleton;
  });
};
const loadNextPage = async () => {
  if (isLoading || !hasMorePages) return;
  isLoading = true;
  movieUl.append(...createSkeletonItems());
  const response = movieFetcher.currentMovieResponse;
  hasMorePages = response.page < response.total_pages;
  if (!hasMorePages) {
    removeSkeletons();
    return;
  }
  const isSearchMode = movieFetcher.isSearchState;
  await (isSearchMode ? movieFetcher.getNextPageSearchMovies() : movieFetcher.getNextPagePopularMovies());
  isLoading = false;
};
const removeSkeletons = () => {
  const skeletons = movieUl.querySelectorAll(".next-page-skeleton");
  skeletons.forEach((skeleton) => skeleton.remove());
};
const setupInfiniteScroll = () => {
  if (observer) {
    observer.disconnect();
  }
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMorePages) {
      loadNextPage();
    }
  });
  observer.observe(observerTarget);
};
const renderInitialLoadingState = () => {
  movieUl.innerHTML = "";
  movieUl.append(...createSkeletonItems());
};
const renderEmptyState = () => {
  const emptyElement = Empty();
  movieUl.innerHTML = "";
  movieUl.appendChild(emptyElement);
  observerTarget.classList.add("hidden");
};
const renderMovies = (movies, response) => {
  const movieElements = createMovieItems(movies);
  if (response.page === 1) {
    movieUl.innerHTML = "";
    movieUl.append(...movieElements);
  } else {
    removeSkeletons();
    movieUl.append(...movieElements);
  }
  hasMorePages = response.page < response.total_pages;
  if (!hasMorePages) {
    observerTarget.classList.add("hidden");
  } else {
    observerTarget.classList.remove("hidden");
  }
};
const renderMovieList = () => {
  const results = movieFetcher.movies || [];
  const query = movieFetcher.queryText;
  const response = movieFetcher.currentMovieResponse;
  const isLoadingState = movieFetcher.isLoadingState;
  const isSearch = movieFetcher.isSearchState;
  const error = movieFetcher.errorState;
  const isNewSearch = isSearch && query !== prevSearchQuery;
  prevSearchQuery = query;
  updateListTitle(titleText, isSearch, query);
  if (error) {
    renderErrorState();
    return;
  }
  if (isLoadingState && response.page === 1 && (isFirstSearch || isNewSearch)) {
    renderInitialLoadingState();
    isFirstSearch = false;
    return;
  }
  if (isSearch && results.length === 0 && !isLoadingState) {
    renderEmptyState();
    return;
  }
  if (!isLoadingState) {
    renderMovies(results, response);
    setupInfiniteScroll();
  }
};
const MovieList = () => {
  const app = document.querySelector("#app");
  if (!app) {
    throw new Error("#app에 해당하는 요소가 없습니다.");
  }
  app.appendChild(mainElement);
  movieFetcher.getPopularMovies(1);
  renderMovieList();
  movieFetcherEvent.subscribe(renderMovieList);
  return mainElement;
};
const App = async () => {
  const app = document.querySelector("#app");
  if (!app) {
    throw new Error("#app에 해당하는 요소가 없습니다.");
  }
  app.append(Header(), await MovieList(), Footer());
};
window.addEventListener("load", () => {
  App();
});
