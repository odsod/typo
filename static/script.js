var vm = {};

vm.repository = ko.observable('');

var fileViewModel = function(file) {
  var vm = file;
  vm.isFile = file.type === 'file';
  vm.isFolder = file.type === 'dir';
  return vm;
};

vm.onSubmitRepository = function() {
  $.getJSON('/github/repos/' + vm.repository() + '/contents', function(files) {
    vm.files(files.map(fileViewModel));
  });
};

vm.files = ko.observable([]);

vm.files.subscribe(console.log.bind(console));

ko.applyBindings(vm);
