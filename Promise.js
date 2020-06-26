module.exports = (function() {
    var PROMISE = {};

    function Promise(executor) {
        if (typeof executor !== 'function' && executor !== PROMISE) {
            throw new Error(executor + ' is not a function');
        }

        if (!(this instanceof Promise)) {
            throw new Error(this + ' is not a promise');
        }

        var data = {
            status: 'pending',
            self: this,
            resolveTasks: [],
            rejectTasks: [],
        };

        Object.defineProperties(this, {
            value: {
                enumerable: false,
                configurable: false,
                get: function() {
                    return data.value;
                },
            },
            status: {
                enumerable: false,
                configurable: false,
                get: function() {
                    return data.status;
                },
            }
        });

        this.addResolveTask = function(task) {
            if (!(this instanceof Promise)) return;
            data.resolveTasks.push(task);
        };

        this.addRejectTask = function(task) {
            if (!(this instanceof Promise)) return;
            data.rejectTasks.push(task);
        };

        function doResolveTasks() {
            data.rejectTasks = [];
            data.resolveTasks.forEach(function(task) {
                setTimeout(task);
            });
        }

        function doRejectTasks() {
            data.resolveTasks = [];
            data.rejectTasks.forEach(function(task) {
                setTimeout(task);
            });
        }

        this.createTask = function(callback) {
            return function() {
                callback(data.value);
            };
        };

        this.resolve = function(value) {
            setTimeout(function() {
                data.status = 'resolved';
                data.value = value;
                doResolveTasks();
            });
        };
        
        this.reject = function(value) {
            setTimeout(function() {
                data.status = 'rejected';
                data.value = value;
                doRejectTasks();
            });
        };

        if (typeof executor === 'function') {
            try {
                executor(this.resolve, this.reject);
            } catch(err) {
                this.reject(err);
            }
        }

        Promise.prototype.then = function(resolve, reject) {
            var promise = new Promise(PROMISE);

            var resolveTask = this.createTask(function(value) {
                var resolvedValue = resolve(value);
                promise.resolve(resolvedValue);
            });
            var rejectTask = this.createTask(function(value) {
                var rejectedValue = reject(value);
                promise.resolve(rejectedValue); // resolve 맞음
            });
            
            switch (this.status) {
            case 'pending':
                this.addResolveTask(resolveTask);
                this.addRejectTask(rejectTask);
                break;

            case 'resolved':
                this.reaction(resolveTask);
                break;
                
            case 'rejected':
                this.reaction(rejectTask);
                break;
            }

            return promise;
        }

        Promise.prototype.catch = function(resolve) {
            var promise = new Promise(PROMISE);

            var resolveTask = this.createTask(function(value) {
                var resolvedValue = resolve(value);
                promise.resolve(resolvedValue);
            });
            
            switch (this.status) {
            case 'pending':
                this.addRejectTask(resolveTask);
                break;
                
            case 'rejected':
                this.reaction(resolveTask);
                break;
            }

            return promise;
        }

        /**
         * then, catch에서 반환하는 new Promise일 경우 실행
         */
        this.reaction = function(callback) {
            if (data.status === 'pending') return;

            callback(data.value);
        }
    }

    return Promise;
})();