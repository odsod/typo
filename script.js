var fullText = 'var foo = \'bar\';\nvar baz = \'booze\';\n\nif (blaz) {\n  return haz;\n}';

var highlightedText = Prism.highlight(fullText, Prism.languages.javascript, 'javascript');
var container = document.createElement('div');
container.innerHTML = highlightedText;
var classNamesForIndices = [];
var currNode = container.firstChild,
    currIndexInFullText = 0;
while (currNode) {
  var currNodeTextLength,
      currNodeClasses;
  if (currNode.nodeType === 1) { // Wrapper
    currNodeTextLength = currNode.innerText.length;
    currNodeClasses = currNode.className;
  } else if (currNode.nodeType === 3) { // Text
    currNodeTextLength = currNode.nodeValue.length;
    currNodeClasses = '';
  } else {
    throw new Error('Unexpected nodeType ' + currNode.nodeType);
  }
  for (var i = 0; i < currNodeTextLength; ++i) {
    classNamesForIndices[currIndexInFullText + i] = currNodeClasses;
  }
  currIndexInFullText += currNodeTextLength;
  currNode = currNode.nextSibling;
}

var indicesToSkip = [];
var skipInitialWhitespace = /^\s+/gm;
var match;
while (!!(match = skipInitialWhitespace.exec(fullText))) {
  for (var i = 0; i < match[0].length; ++i) {
    indicesToSkip[match.index + i] = true;
  }
}

var UntypeableCharacter = function(fullText, indexInFullText) {
  this.character = fullText[indexInFullText];
  this.hasBeenTypedCorrectly = false;
  this.hasBeenTypedIncorrectly = false;
  this.isNextCharacterToBeTyped = false;
  this.syntaxHighlightClasses = '';
  this.isReturn = false;
};

var TypeableCharacter = function(fullText, indexInFullText, typedText, indicesToSkip, syntaxHighlightClasses) {
  var self = this;

  var skippedCharactersBeforeMe = indicesToSkip.slice(0, indexInFullText + 1).reduce(function(total, skip) {
    return total + (skip ? 1 : 0);
  }, 0);

  var indexInTypedText = indexInFullText - skippedCharactersBeforeMe;

  this.hasBeenTyped = function() {
    return ko.unwrap(typedText).length > indexInTypedText;
  };

  this.character = ko.computed(function() {
    if (self.hasBeenTyped()) {
      return ko.unwrap(typedText)[indexInTypedText];
    } else {
      return fullText[indexInFullText];
    }
  });

  this.hasBeenTypedCorrectly = ko.computed(function() {
    return ko.unwrap(typedText)[indexInTypedText] ===
           fullText[indexInFullText];
  });

  this.hasBeenTypedIncorrectly = ko.computed(function() {
    return self.hasBeenTyped() &&
           ko.unwrap(typedText)[indexInTypedText] !==
           fullText[indexInFullText];
  });

  this.isNextCharacterToBeTyped = ko.computed(function() {
    return indexInTypedText === ko.unwrap(typedText).length;
  });

  this.syntaxHighlightClasses = ko.computed(function() {
    if (self.hasBeenTypedCorrectly()) {
      return syntaxHighlightClasses;
    } else {
      return '';
    }
  });

  this.isReturn = ko.computed(function() {
    return self.character() === '\n';
  });
};

var vm = {};

vm.typedText = ko.observable('');

vm.charactersInFullText = fullText.split('').map(function(_, indexInFullText) {
  if (indicesToSkip[indexInFullText]) {
    return new UntypeableCharacter(fullText, indexInFullText);
  } else {
    return new TypeableCharacter(fullText, indexInFullText, vm.typedText, indicesToSkip, classNamesForIndices[indexInFullText]);
  }
});

ko.bindingHandlers.alwaysFocus = {
  init: function(element) {
    var blurHandler = function() {
      setTimeout(function() { element.focus(); }, 0);
    };
    ko.utils.domData.set(element, 'alwaysFocusBlurHandler', blurHandler);
  },
  update: function(element, valueAccessor) {
    var blurHandler = ko.utils.domData.get(element, 'alwaysFocusBlurHandler');
    if (ko.unwrap(valueAccessor())) {
      element.addEventListener('blur', blurHandler);
      blurHandler();
    } else {
      element.removeEventListener('blur', blurHandler);
    }
  }
};

ko.bindingHandlers['class'] = {
  'update': function(element, valueAccessor) {
    if (element['__ko__previousClassValue__']) {
      ko.utils.toggleDomNodeCssClass(element, element['__ko__previousClassValue__'], false);
    }
    var value = ko.utils.unwrapObservable(valueAccessor());
    ko.utils.toggleDomNodeCssClass(element, value, true);
    element['__ko__previousClassValue__'] = value;
  }
};

vm.getSyntaxHighlightClassesForIndex = function(index) {
  return classNamesForIndices[ko.unwrap(index)];
};

ko.applyBindings(vm);
