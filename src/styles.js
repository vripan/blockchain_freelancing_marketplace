import styled, {
	createGlobalStyle
} from "styled-components";

export const GlobalStyles = createGlobalStyle `
	* {
		box-sizing: border-box;
	}
  :root {
		/** color */
    --fg-default: #F5F9FC;
		--fg-dimmer: #C2C8CC;
		--fg-dimmest: #9DA2A6;
		--bg-root: #0E1525;
		--bg-default: #1C2333;
		--bg-higher: #2B3245;
		--bg-highest: #3C445C;
		--outline-default: #70788C;
		--outline-dimmer:  #5F677A;
		--outline-dimmest: #4E5569;
		--overlay: #0e1525A0;

		/**accents */
		--accent-primary-default: #0099FF;
		--accent-primary-dimmer: #0072BD;

		--accent-negative-default: #F23F3F;
		--accent-negative-dimmer: #8F2828;

		--accent-warning-default: #CCAD14;
		--accent-warning-dimmer: #756200;

		/**type */
		--font-family-default: 'IBM Plex Sans', sans-serif;
		--font-family-code: 'IBM Plex Mono', monospace;

		--font-size-header: 24px;
		--font-size-subheader: 18px;
		--font-size-medium: 16px;
		--font-size-default: 14px;
		--font-size-small: 12px;

		/**spacing */
		--space-8: 8px;
		--space-16: 16px;
		--space-24: 24px;
		--space-32: 32px;

		/**border radius */
		--br-8: 8px;


  }
	* {
		font-family: var(--font-family-default);
		font-size: var(--font-size-default);
	}

	a {
		color: var(--accent-primary-default);
	}
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8);
		font-weight: 500;
		border-radius: var(--br-8);
		outline: none;
		background-color: var(--bg-higher);
		border: 1px solid var(--bg-higher);
		color: white;
		font-size: var(--font-size-default);
		line-height: var(--font-size-default);
		cursor: pointer;
	}
  button:disabled {
		background: var(--bg-highest) !important;
		border-color: var(--bg-higher) !important;
		color: var(--fg-dimmest) !important;
  }
	button.primary {
		border: 1px solid var(--accent-primary-dimmer);
		background-color: var(--accent-primary-dimmer);
		color: white;
	}
	body {
		padding: 0;
		margin: 0;
		width: 100%;
		min-height: 100vh;
	}

	h1, h2, h3, p {
		color: var(--fg-default);
	}

	h1 {
		font-size: var(--font-size-header);
		margin: 0;
		font-weight: 500;
	}
	.main-title {
		font-size: var(--font-size-subheader) !important;
	}

	h2 {
		font-size: var(--font-size-subheader);
		margin: 0;
		font-weight: 500;
	}

	p, span {
		font-size: var(--font-size-default);
	}

	code, pre {
		font-size: var(--font-size-default);
		font-family: var(--font-family-code);
		white-space: pre-wrap;
		padding: var(--space-8);
		margin: 0;
	}

	.code-error {
		color: var(--accent-negative-default);
	}

	select {
		background: var(--bg-root);
		border: 1px solid var(--outline-default);
		border-radius: var(--br-8);
		padding: var(--space-8);
		color: var(--fg-default);
		background-position-x: 2px;
	}

	select:focus, input:focus, button:focus, button:active {
		outline: none;
		border: 1px solid var(--accent-primary-default);
	}

	input {
		background: var(--bg-higher);
		color: var(--fg-default);
		padding: var(--space-8);
		border-radius: var(--br-8);
		border: 1px solid var(--outline-default);
	}

	#root {
		display: flex;
		align-items: center;
		flex-direction: column;
		background-color: var(--bg-root);
		width: 100%;
		height: 100%;
	}

	/** extra goodies for loading states */
	@keyframes flickerAnimation {
		0%   { opacity:1; }
		50%  { opacity:0; }
		100% { opacity:1; }
	}
	@-o-keyframes flickerAnimation{
		0%   { opacity:1; }
		50%  { opacity:0; }
		100% { opacity:1; }
	}
	@-moz-keyframes flickerAnimation{
		0%   { opacity:1; }
		50%  { opacity:0; }
		100% { opacity:1; }
	}
	.animate-flicker {
		-moz-animation: flickerAnimation 2s infinite;
		-o-animation: flickerAnimation 2s infinite;
			animation: flickerAnimation 2s infinite;
	}
	
	/** main media query */
	@media only screen and (max-width: 480px) {
		.deployment-header, .address-balance  {
    	flex-direction: column;
			gap: 8px;
			align-items: start !important;
			justify-content: stretch !important;
		}
		.address-balance {
			flex-direction: column-reverse;
			gap: 8px;
			align-items: flex-end !important;
		}

		.run-button {
			width: 100% !important;
		}

		.deployer, .deployer > select {
			width: 100%;
		}

		.function-list {
			width: 140px !important;
		}
		.function-state-text {
			display: none !important;
		}
  }
`;

export const UnstyledButton = styled.button `
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  borderradius: var(--br-8);
  border: 1px solid transparent;
  background: transparent;
`;

export const OutlinedButton = styled(UnstyledButton)
`
  font-weight: medium;
  border: 1px solid var(--bg-highest);
  background-color: var(--bg-root);
`;

export const Wrapper = styled.div `
  display: flex;
  flex-direction: column;
  background-color: var(--bg-root);
  color: var(--fg-default);
  min-height: 100vh;
  width: 100%;
  max-width: 768px;
  padding: var(--space-16);
`;

export const Card = styled.div `
  background-color: var(--bg-default);
`;

export const Dot = styled.div `
  background: ${(props) => props.color};
  width: 6px;
  height: 6px;
  border-radius: 100px;
`;

export const VStack = styled.div `
  display: flex;
  flex-direction: column;
`;
export const HStack = styled.div `
  display: flex;
  flex-direction: row;
`;

export const Overlay = styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: var(--overlay);
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
`;

export const Divider = styled.div `
  background-color: var(--outline-dimmest);
  height: 1px;
  width: 100%;
  margin: var(--space-16) 0;
`;