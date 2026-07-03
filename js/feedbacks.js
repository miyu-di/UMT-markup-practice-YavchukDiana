import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const feedbacksToFetch = 15;
const feedbackList = document.getElementById("feedback-list");
let swiperInstance = null;

function buildFeedbackMarkup() {
	return `
    <li class="swiper-slide feedback-card">
        <p class="feedback-quote"></p>
        <p class="feedback-author"></p>
    </li>
    `;
}

function fillFeedbackItem(listItem, feedback) {
	const quoteEl = listItem.querySelector(".feedback-quote");
	if (quoteEl) quoteEl.textContent = feedback.text;

	const authorEl = listItem.querySelector(".feedback-author");
	if (authorEl) authorEl.textContent = feedback.author;
}

function renderFeedbacks(feedbacks) {
	if (!feedbackList) return;
	feedbackList.replaceChildren();

	const chunkMarkup = feedbacks.map(() => buildFeedbackMarkup()).join("");
	feedbackList.insertAdjacentHTML("beforeend", chunkMarkup);

	const listItems = feedbackList.querySelectorAll(":scope > .swiper-slide");
	feedbacks.forEach((feedback, i) => {
		if (listItems[i]) fillFeedbackItem(listItems[i], feedback);
	});
}

function initSwiperSlider() {
	swiperInstance = new Swiper(".swiper", {
		modules: [Navigation],
		slidesPerView: 1,
		spaceBetween: 20, 
		navigation: {
			nextEl: "#feedback-next",
			prevEl: "#feedback-prev",
		},
		breakpoints: {
			768: {
				slidesPerView: 2,
				spaceBetween: 30,
			},
			1024: {
				slidesPerView: 3, 
				spaceBetween: 40,
			},
		},
	});
}

async function loadFeedbacks() {
	if (!feedbackList) return;

	try {
		const response = await apiClient.get("/feedbacks", {
			params: {
				_per_page: feedbacksToFetch,
			},
		});

		const responseBody = response.data;
		const feedbacks = Array.isArray(responseBody) ? responseBody : (responseBody?.data ?? []);

		renderFeedbacks(feedbacks);

		initSwiperSlider();
	} catch (error) {
		const msg = extractErrorMessage ? extractErrorMessage(error) : "Failed to load feedbacks";
		if (showErrorNotification) showErrorNotification(msg);
		else console.error(error);
	}
}

loadFeedbacks();
