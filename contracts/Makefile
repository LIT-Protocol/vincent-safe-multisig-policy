include .env

.PHONY: deploy
deploy:
	forge script script/SafeMessageTracker.s.sol:SafeMessageTrackerScript \
		--rpc-url $(DEPLOYMENT_RPC_URL) \
		--private-key $(DEPLOYER_PRIVATE_KEY) \
		--broadcast

.PHONY: get-abis
get-abis:
	@mkdir -p abis
	@echo "Getting ABI for SafeMessageTracker..."
	@forge inspect SafeMessageTracker abi --json > abis/SafeMessageTracker.abi.json
	@echo "ABIs written to abis/*.abi.json"
	@echo "🔄 Running postbuild scripts..."
	@for script in $$(ls -v postbuild-scripts/*.ts); do \
		echo "Running $$script..."; \
		bun run $$script; \
		if [ $$? -ne 0 ]; then \
			echo "Error running $$script"; \
			exit 1; \
		fi; \
	done
	@echo "✅ All postbuild scripts completed successfully." 

.PHONY: help
help:
	@echo "Available targets:"
	@echo "  deploy    - Deploy SafeMessageTracker contract"
	@echo "  get-abis  - Get ABIs for all contracts"
	@echo "  help      - Show this help message"