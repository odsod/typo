var fullText = '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <link href="styles.css" rel="stylesheet">\n</head>\n<body>\n\n  <pre data-bind="foreach: charactersInFullText"><span data-bind="\n    text: character,\n    class: syntaxHighlightClasses,\n    css: {\n      typed: hasBeenTypedCorrectly,\n      wrong: hasBeenTypedIncorrectly,\n      next: isNextCharacterToBeTyped,\n      return: isReturn\n    }\n  "></span></pre>\n\n  <textarea class="offscreen" data-bind="\n    value: typedText,\n    valueUpdate: \'afterkeydown\',\n    alwaysFocus: true\n  "></textarea>\n\n  <script src="knockout-3.0.0.js"></script> \n  <script src="prism.js"></script>\n  <script src="script.js"></script>\n</body>\n</html>\n';

var classNamesForIndices = [];

var escapePrism = function(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\u00a0/g, ' ');
};

var unescapePrism = function(code) {
  return code
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<');
};

(function() {
  var currIndexInFullText = 0;
  var parsePrismNodes = function parsePrismNodes(nodes, currentClassName) {
    for (var i = 0; i < nodes.length; ++i) {
      var node = nodes[i];
      if (node.nodeType === 3) { // Text
        var textLength = unescapePrism(node.nodeValue).length;
        for (var j = 0; j < textLength; ++j) {
          classNamesForIndices[currIndexInFullText + j] = currentClassName;
        }
        currIndexInFullText += textLength;
      } else if (node.nodeType === 1) { // Parent node
        parsePrismNodes(node.childNodes, node.className);
      } else {
        console.log(node);
        //throw new Error('Unexpected nodeType ' + node.nodeType);
      }
    }
  };

  var highlightedText = Prism.highlight(escapePrism(fullText), Prism.languages.markup, 'html');
  var container = document.createElement('pre');
  container.innerHTML = highlightedText;
  parsePrismNodes([container], '');
}());

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

ko.applyBindings(vm);
