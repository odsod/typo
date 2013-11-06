var target = 'var foo = \'bar\';\nvar baz = \'booze\';\nif (blaz) {\n  return haz;\n}';

var commonPrefixLength = function(lhs, rhs) {
  var i = 0;
  while (i < Math.min(lhs.length, rhs.length) && lhs[i] === rhs[i]) { ++i; }
  return i;
};

var vm = {};

vm.typed = ko.observable('');

vm.hasTypedCharacterCorrectly = function(index) {
  return ko.unwrap(index) < commonPrefixLength(vm.typed(), target);
};

vm.hasTypedCharacterIncorrectly = function(index) {
  return false; // TODO
};

vm.isNextCharacterToBeTyped = function(index) {
  return ko.unwrap(index) === vm.typed().length;
};

vm.chars = target.split('');

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
