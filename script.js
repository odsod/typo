var fullText = 'var foo = \'bar\';\nvar baz = \'booze\';\n\nif (blaz) {\n  return haz;\n}';

var indicesToSkip = [];

var skipInitialWhitespace = /^\s+/gm;

var match;
while (!!(match = skipInitialWhitespace.exec(fullText))) {
  for (var i = 0; i < match[0].length; ++i) {
    indicesToSkip[match.index + i] = true;
  }
}

var UntypeableCharacter = function(fullText, indexInFulltext) {
  this.character = fullText[indexInFulltext];
  this.hasBeenTypedCorrectly = false;
  this.hasBeenTypedIncorrectly = false;
  this.isNextCharacterToBeTyped = false;
  this.isReturn = false;
};

var TypeableCharacter = function(fullText, indexInFullText, typedText, indicesToSkip) {
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
    return new TypeableCharacter(fullText, indexInFullText, vm.typedText, indicesToSkip);
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

ko.applyBindings(vm);
