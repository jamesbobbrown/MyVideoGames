namespace WebApi.DTOs;

public class BasicDTO
{
    public int? Id { get; set; }
}

public class PaginationDTO
{
    public int Cantidad { get; set; }
    public int Pagina { get; set; }
}

public class RequestDTO<T>
{
    public T? Data { get; set; }
    public PaginationDTO? Pagination { get; set; }
    public List<FilterDTO>? Filters { get; set; } = new();
}