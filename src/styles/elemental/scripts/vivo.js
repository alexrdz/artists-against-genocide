export const signals = {}
let context = [];
export const eventHandlers = {};


export function createHandler(handlerName, handler) {
  eventHandlers[handlerName] = handler;
}


export function untrack(fn) {
    const prevContext = context;
    context = [];
    const res = fn();
    context = prevContext;
    return res;
}

function cleanup(observer) {
    for (const dep of observer.dependencies) {
        dep.delete(observer);
    }
    observer.dependencies.clear();
}

function subscribe(observer, subscriptions) {
    subscriptions.add(observer);
    observer.dependencies.add(subscriptions);
}

export function createSignal(signalName, value) {
    const subscriptions = new Set();

    const read = () => {
        const observer = context[context.length - 1]
        if (observer) subscribe(observer, subscriptions);
        return value;
    }
    const write = (newValue) => {
        value = newValue;
        for (const observer of [...subscriptions]) {
            observer.execute();
        }
    }

    signals[signalName] = [read, write];

    return [read, write];
}

export function createEffect(fn) {
    const effect = {
        execute() {
            cleanup(effect);
            context.push(effect);
            fn();
            context.pop();
        },
        dependencies: new Set()
    }

    effect.execute();
}

export function createMemo(fn) {
    const [signal, setSignal] = createSignal();
    createEffect(() => setSignal(fn()));
    return signal;
}

const processedElements = new WeakSet();

function processElement(element) {
  if (processedElements.has(element)) return;

  const supportedEvents = ['click', 'change', 'input', 'load', 'submit', 'mouseover'];
  const [evt, funcName] = element.getAttribute('data-vivo').split(':');
  const func = eventHandlers[funcName];

  // if (!supportedEvents.includes(evt)) {
  //   console.warn(`Event ${evt} is not supported.`);
  // }

  if (typeof func === 'function') {
    element.addEventListener(evt, func);
    processedElements.add(element);
  }
}

function setupInitialEventListeners() {
  const elements = document.querySelectorAll('[data-vivo]');
  elements.forEach(processElement);
  initializeDataBindings();
}

document.addEventListener('DOMContentLoaded', setupInitialEventListeners);

// Use a MutationObserver to handle dynamically added elements
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.hasAttribute('data-vivo')) {
            processElement(node);
          }
          const childElements = node.querySelectorAll('[data-vivo]');
          childElements.forEach(processElement);
        }
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

// document.addEventListener('DOMContentLoaded', () => {
//   const supportedEvents = ['click', 'change', 'input', 'load', 'submit', 'mouseover'];
//   const elements = document.querySelectorAll('[data-vivo]');

//   elements.forEach(element => {
//     const [evt, funcName] = element.getAttribute('data-vivo').split(':');
//     const func = eventHandlers[funcName]
//     if (!supportedEvents.includes(evt)) {
//       console.warn(`Event ${evt} is not supported.`);
//     }

//     if (typeof func === 'function') {
//       element.addEventListener(evt, func);
//       initializeDataBindings()
//     }
//   });
// });

function handleDataAttribute(attribute, propertyToSet) {
  const elements = document.querySelectorAll(`[data-${attribute}]`);

  elements.forEach(element => {
    const sig = element.getAttribute(`data-${attribute}`);
    const [signal, setSignal] = signals[sig];
    createEffect(() => {
      element[propertyToSet] = signal();
    });
  });
}

function initializeDataBindings() {
  const bindings = [
    { attribute: 'text', property: 'innerText' },
    { attribute: 'html', property: 'innerHTML' },
    { attribute: 'check', property: 'checked' },
    { attribute: 'value', property: 'value' }
  ];

  bindings.forEach(({ attribute, property }) => {
    handleDataAttribute(attribute, property);
  });
}

export function createHTML(elementsArray) {
  const fragment = document.createDocumentFragment();
  elementsArray.forEach(element => {
    fragment.appendChild(element)
  })
  const tempContainer = document.createElement('div');
  tempContainer.appendChild(fragment);
  return tempContainer.innerHTML
}

export function createElement(elName, content, attrs = {}) {
  const el = document.createElement(elName);
  for (const key in attrs) {
      el.setAttribute(key, attrs[key]);
  }

  if (typeof content === "string") {
      el.innerHTML = content;
  }

  if (content instanceof HTMLElement) {
      el.appendChild(content);
  }

  return el;
}
