// Contrato mínimo que Vercel entrega a las funciones serverless.
// Mantenerlo local evita instalar todo el runtime de Vercel únicamente por tipos.
export interface VercelRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[]>
  body: unknown
}

export interface VercelResponse {
  setHeader(nombre: string, valor: string | number | readonly string[]): this
  status(codigo: number): this
  json(cuerpo: unknown): this
  send(cuerpo: unknown): this
  end(): this
}
