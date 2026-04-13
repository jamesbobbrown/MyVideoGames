using WebApi.DTOs;

namespace WebApi.Utilities;

public static class SqlUtilities
{
    public static int ObtenerOffset(this PaginationDTO? pag)
    {
        if (pag == null) pag = new PaginationDTO();

        int pagina = pag.Pagina <= 0 ? 1 : pag.Pagina;
        int cantidad = pag.Cantidad <= 0 ? 100 : pag.Cantidad;

        return (pagina - 1) * cantidad;
    }

    public static readonly List<string> OperadoresValidos = new()
    {
        "=", ">", "<", "<>", "!=", "LIKE", ">=", "<="
    };

    public static bool EsOperadorValido(string operador) =>
        OperadoresValidos.Contains(operador.ToUpper());
}