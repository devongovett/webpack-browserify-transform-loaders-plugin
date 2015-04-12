BIN = ./node_modules/.bin
SRC = $(shell find src -name '*.js')
LIB = $(SRC:src/%=lib/%)
TESTS = $(wildcard ./src/__tests__/*.js)

BABEL_OPTS = \
	--stage 0 \
	--optional runtime

MOCHA_OPTS = \
	-R dot \
	--compilers js:./scripts/register-babel

build: $(LIB)

example::
	@$(BIN)/babel-node $(BABEL_OPTS) ./example/server.js

install link:
	@npm $@

test::
	$(BIN)/babel-node $(BABEL_OPTS) $(BIN)/webpack \
		--bail \
		--context example/ \
		--config example/webpack.config.js

lint::

release-patch: build test lint
	@$(call release,patch)

release-minor: build test lint
	@$(call release,minor)

release-major: build test lint
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

lib/%.js: src/%.js
	@echo "building $@"
	@mkdir -p $(@D)
	@$(BIN)/babel $(BABEL_OPTS) --source-maps-inline -o $@ $<

clean:
	@rm -f $(LIB)

define release
	npm version $(1)
endef
