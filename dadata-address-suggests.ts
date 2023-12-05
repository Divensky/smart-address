

const DEBOUNCE_TIMEOUT = 500;
const DADATA_FORM_SELECTOR = '.js-dadata-form';
const DADATA_SELECTOR = '.js-address';
const DADATA_LOCATIONS = [{ region: 'москва' }, { region: 'московская' }];
const COMPLEX_COORDS = [55.497536, 36.918034]; // Как в contacts-map.js
const SUGGESTIONS_CONTAINER_CLASS = 'dadata__suggestions-container';
const fetchingMonitor: { isFetching: boolean; abort?: () => void } = {
  isFetching: false,
};
const url =
  'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';
const token = 'Use Your Own API Token Obtained From https://dadata.ru/api/suggest/address/'

async function getDaDataAddressSuggests(
  query: string,
  locations?: { region: string }[]
) {
// The body of this function is omitted from the repo as noted in the Readme. Please use the API access instructions from the official website. 
}

function updateInputValue(
  activeLine: HTMLParagraphElement,
  inputElement: HTMLInputElement
) {
  const clickedText = activeLine.textContent;
  if (!clickedText) return;
  /* eslint-disable no-param-reassign */
  inputElement.value = clickedText;
  /* eslint-enable no-param-reassign */
}

function getFirstElement(divElement: HTMLDivElement) {
  let firstEl = divElement.firstElementChild;
  while (firstEl && firstEl.tagName !== 'P') {
    firstEl = firstEl.nextElementSibling;
  }
  return firstEl as HTMLParagraphElement;
}

function moveUp(activeLine: HTMLParagraphElement, divElement: HTMLDivElement) {
  if (
    activeLine.previousElementSibling instanceof HTMLParagraphElement &&
    activeLine.dataset.index !== '0'
  ) {
    activeLine.previousElementSibling.focus();
  } else {
    (divElement.lastElementChild as HTMLParagraphElement).focus();
  }
}

function moveDown(
  activeLine: HTMLParagraphElement,
  divElement: HTMLDivElement
) {
  if (activeLine.nextElementSibling instanceof HTMLParagraphElement) {
    activeLine.nextElementSibling.focus();
  } else {
    (getFirstElement(divElement) as HTMLParagraphElement).focus();
  }
}

function populateAddressSuggestions(
  input: string,
  suggestions: { value: string }[]
): string {
  let innerHTML =
    '<span class="dadata__subtitle">Выберите вариант или продолжите ввод</span>';

  suggestions.forEach(({ value }, index: number) => {
    const startIndex = value.toLowerCase().indexOf(input.toLowerCase());
    if (startIndex >= 0) {
      const beginning = value.substring(0, startIndex);
      const middle = `<strong>${value.substring(
        startIndex,
        startIndex + input.length
      )}</strong>`;
      const end = value.substring(startIndex + input.length);
      const valueWithHighlight = beginning + middle + end;
      innerHTML += `<p class="dadata__suggestion" tabindex="0" data-index="${index}">${valueWithHighlight}</p>`;
    } else {
      innerHTML += `<p class="dadata__suggestion" tabindex="0" data-index="${index}">${value}</p>`;
    }
  });
  return innerHTML;
}

function initContainer(inputElement: HTMLElement) {
  const { parentElement } = inputElement;
  if (!parentElement) return null;

  let div = parentElement.querySelector(`.${SUGGESTIONS_CONTAINER_CLASS}`);
  let isMounted = true;
  if (!div) {
    isMounted = false;
    div = document.createElement('div');
    div.classList.add(SUGGESTIONS_CONTAINER_CLASS);
  }

  return {
    div: div as HTMLDivElement,
    isMounted,
    mount() {
      if (!this.isMounted) {
        parentElement.appendChild(this.div);
        this.isMounted = true;
      }
    },
    unmount() {
      if (this.isMounted) {
        parentElement.removeChild(this.div);
        this.isMounted = false;
      }
    },
  };
}

async function handleInput(inputEvent: Event) {
  const inputElement: HTMLInputElement = inputEvent.target as HTMLInputElement;
  const suggestionsContainer = initContainer(inputElement);
  if (!suggestionsContainer) return;

  const input: string = inputElement.value.trim();
  if (input === '' || !input) {
    suggestionsContainer.unmount();
    return;
  }

  if (fetchingMonitor.isFetching && fetchingMonitor.abort) {
    fetchingMonitor.abort();
  }
  fetchingMonitor.isFetching = true;
  const { promise, abort } = await getDaDataAddressSuggests(input, DADATA_LOCATIONS);
  fetchingMonitor.abort = abort;
  promise
    .then((resolve) => {
      const { suggestions } = resolve as { suggestions: { value: string }[] };
      if (!suggestions.length) return;
      suggestionsContainer.div.innerHTML = populateAddressSuggestions(
        input,
        suggestions
      );
      if (suggestionsContainer.isMounted) return;

      suggestionsContainer.mount();
      suggestionsContainer.div.addEventListener('click', (evt) => {
        const activeLine = (evt.target as HTMLElement).closest(
          'p'
        ) as HTMLParagraphElement;
        updateInputValue(activeLine, inputElement);
        suggestionsContainer.unmount();
      });

      suggestionsContainer.div.addEventListener('keydown', (evt) => {
        const activeLine = (evt.target as HTMLElement).closest(
          'p'
        ) as HTMLParagraphElement;
        const { key } = evt;
        switch (key) {
          case 'Enter': {
            evt.preventDefault();
            updateInputValue(activeLine, inputElement);
            suggestionsContainer.unmount();
            inputElement.focus();
            break;
          }
          case 'Escape':
            suggestionsContainer.unmount();
            inputElement.focus();
            break;
          case 'ArrowUp':
            moveUp(activeLine, suggestionsContainer.div);
            break;
          case 'ArrowDown':
            moveDown(activeLine, suggestionsContainer.div);
            break;
          case 'Tab':
            evt.preventDefault();
            if (evt.shiftKey) {
              moveUp(activeLine, suggestionsContainer.div);
            } else {
              moveDown(activeLine, suggestionsContainer.div);
            }
            break;
          default:
            break;
        }
      });
    })
    .catch(() => {
      // console.log('Произошла ошибка', err);
    })
    .finally(() => {
      fetchingMonitor.isFetching = false;
    });
}

export function debounce(func: any, timeout: number | undefined) {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

function openYandexMap(fromAddress: string) {
  const encodedAddress = encodeURIComponent(fromAddress);
  const endpoint = `${COMPLEX_COORDS[0]},${COMPLEX_COORDS[1]}`;
  const mapsUrl = `https://yandex.ru/maps/?rtext=${encodedAddress}~${endpoint}`;
  window.open(mapsUrl, '_blank');
}

function handleDadataSubmit(
  inputElement: HTMLInputElement,
  submitEvent: Event
) {
  submitEvent.preventDefault();
  openYandexMap(inputElement.value);
}

function initDadataForm() {
  const debouncedInputHandler = debounce(handleInput, DEBOUNCE_TIMEOUT);
  const dadataForm: HTMLFormElement | null =
    document.querySelector(DADATA_FORM_SELECTOR);
  if (!dadataForm) return;
  const addressInputElement: HTMLInputElement | null =
    dadataForm.querySelector(DADATA_SELECTOR);
  if (!addressInputElement) return;
  addressInputElement.addEventListener('input', debouncedInputHandler);
  dadataForm.addEventListener('submit', (evt) =>
    handleDadataSubmit(addressInputElement, evt)
  );
}

document.addEventListener('DOMContentLoaded', initDadataForm);


