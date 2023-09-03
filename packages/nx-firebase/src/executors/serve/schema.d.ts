// maintains the existing executor format as `nx:run-commands` for compatibility
export interface FirebaseServeExecutorSchema {
  commands: string[]
  __unparsed__: string[]
}
