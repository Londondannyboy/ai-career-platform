declare namespace JSX {
  interface IntrinsicElements {
    'hume-ai-voice': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      'auth-type'?: string
      'api-key'?: string
      'config-id'?: string
    }, HTMLElement>
  }
}