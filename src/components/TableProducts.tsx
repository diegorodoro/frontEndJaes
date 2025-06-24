import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Checkbox,
    IconButton,
    Tooltip,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button,
    useToast
} from '@chakra-ui/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { TriangleUpIcon, TriangleDownIcon, DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';

interface Product {
    id: number;
    nombre: string;
    sku: string;
    lote: string;
    cantidad: number;
}

type CheckboxProductsState = { id: number; checked: true }[] | [{ todos: true }];

interface TableProductsProps {
    data: Product[];
    setCheckboxProducts: React.Dispatch<React.SetStateAction<CheckboxProductsState>>;
    searchTerm?: string;
    refreshProducts: () => void;
}

const TableProducts = ({ data: products, setCheckboxProducts, searchTerm = '', refreshProducts }: TableProductsProps) => {
    type SelectedProduct = { id: number; checked: boolean } | { todos: boolean };
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Product | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const toast = useToast();

    // Estado para el AlertDialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Función para abrir el diálogo de confirmación
    const openDeleteDialog = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    // Función para confirmar la eliminación
    const confirmDelete = () => {
        if (productToDelete) {
            setIsDeleting(true);
            // Llamada al endpoint para eliminar el producto
            axios.delete(`${import.meta.env.VITE_API_URL}/productos/${productToDelete.id}/delete/`)
                .then(response => {
                    // Mostrar toast de éxito
                    toast({
                        title: "Producto eliminado",
                        description: `El producto ${productToDelete.nombre} ha sido eliminado correctamente`,
                        status: "success",
                        duration: 5000,
                        isClosable: true,
                        position: "top"
                    });

                    setIsDeleteDialogOpen(false);
                    setProductToDelete(null);
                    refreshProducts(); // Refrescar la lista de productos
                })
                .catch(error => {
                    console.error("Error al eliminar el producto:", error);
                    // Mostrar toast de error
                    toast({
                        title: "Error al eliminar",
                        description: "No se pudo eliminar el producto. Por favor, inténtelo de nuevo.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                        position: "top"
                    });
                })
                .finally(() => {
                    setIsDeleting(false);
                });
        } else {
            setIsDeleteDialogOpen(false);
        }
    };

    // Función para cancelar la eliminación
    const cancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
    };

    // Filtra los productos basado en el término de búsqueda
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return products;

        const searchTermLower = searchTerm.toLowerCase().trim();
        return products.filter(product =>
            product.id.toString().includes(searchTermLower) ||
            product.nombre.toLowerCase().includes(searchTermLower) ||
            product.sku.toLowerCase().includes(searchTermLower) ||
            product.lote.toLowerCase().includes(searchTermLower) ||
            product.cantidad.toString().includes(searchTermLower)
        );
    }, [products, searchTerm]);

    // Helpers para reducir duplicación de código
    const isTodosSelected = useMemo(() =>
        selectedProducts.some(p => 'todos' in p && p.todos),
        [selectedProducts]
    );

    const selectedIds = useMemo(() =>
        selectedProducts
            .filter((p): p is { id: number; checked: boolean } => 'id' in p && p.checked)
            .map(p => p.id),
        [selectedProducts]
    );

    // Estado del checkbox principal
    const isAllChecked = useMemo(() => {
        if (isTodosSelected) return true;

        // Si hay búsqueda, verificar si todos los productos filtrados están seleccionados
        if (searchTerm.trim() && filteredProducts.length > 0) {
            return filteredProducts.every(product => selectedIds.includes(product.id));
        }

        return products.length > 0 && products.length === selectedIds.length;
    }, [isTodosSelected, filteredProducts, selectedIds, products, searchTerm]);

    const isIndeterminate = useMemo(() => {
        if (isAllChecked) return false;

        // Si hay búsqueda, verificar si alguno de los productos filtrados está seleccionado
        if (searchTerm.trim() && filteredProducts.length > 0) {
            return filteredProducts.some(product => selectedIds.includes(product.id));
        }

        return selectedIds.length > 0;
    }, [isAllChecked, filteredProducts, selectedIds, searchTerm]);

    const handleCheckboxChange = (id: number) => {
        setSelectedProducts(prevSelected => {
            // Si todos seleccionados, quitar todos y seleccionar todos menos el clickeado
            if (isTodosSelected) {
                return products
                    .filter(product => product.id !== id)
                    .map(product => ({ id: product.id, checked: true }));
            }

            const isSelected = selectedIds.includes(id);
            let newSelected;

            if (isSelected) {
                newSelected = prevSelected.filter(p => !('id' in p) || p.id !== id);
            } else {
                newSelected = [...prevSelected, { id, checked: true }];
            }

            // Si seleccionamos todos, simplificar al estado todos:true
            if (newSelected.length === products.length) {
                return [{ todos: true }];
            }

            return newSelected;
        });
    };

    const handleSelectAll = () => {
        // Si hay búsqueda activa, solo afectar a los elementos filtrados
        if (searchTerm.trim() && filteredProducts.length !== products.length) {
            setSelectedProducts(prevSelected => {
                if (isAllChecked || isIndeterminate) {
                    // Quitar solo los filtrados de la selección
                    const filteredIds = new Set(filteredProducts.map(p => p.id));
                    return prevSelected.filter(p =>
                        !('id' in p) || !filteredIds.has(p.id)
                    );
                } else {
                    // Agregar todos los filtrados
                    const existingSelectedMap = new Map(
                        prevSelected
                            .filter((p): p is { id: number; checked: boolean } => 'id' in p)
                            .map(p => [p.id, p])
                    );

                    // Combinar selecciones actuales con los productos filtrados
                    const newSelected = [...prevSelected.filter(p => !('todos' in p))];
                    filteredProducts.forEach(product => {
                        if (!existingSelectedMap.has(product.id)) {
                            newSelected.push({ id: product.id, checked: true });
                        }
                    });

                    // Si después de agregar todos los filtrados, tenemos todos los productos seleccionados,
                    // simplificamos al estado todos:true
                    if (newSelected.length === products.length) {
                        return [{ todos: true }];
                    }

                    return newSelected;
                }
            });
        } else {
            // Comportamiento original si no hay búsqueda
            setSelectedProducts(isAllChecked || isIndeterminate ? [] : [{ todos: true }]);
        }
    };

    // Ordenamiento
    const handleSort = (key: keyof Product) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Productos ordenados (aplicados después del filtrado)
    const sortedProducts = useMemo(() => {
        if (!sortConfig.key) return filteredProducts;

        return [...filteredProducts].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof Product];
            const bValue = b[sortConfig.key as keyof Product];
            const direction = sortConfig.direction === 'asc' ? 1 : -1;

            if (aValue < bValue) return -1 * direction;
            if (aValue > bValue) return 1 * direction;
            return 0;
        });
    }, [filteredProducts, sortConfig]);    // Actualiza el estado externo

    useEffect(() => {
        if (isTodosSelected) {
            setCheckboxProducts([{ todos: true }] as CheckboxProductsState);
        } else {
            setCheckboxProducts(
                selectedIds.map(id => ({ id, checked: true as const }))
            );
        }
    }, [selectedProducts, selectedIds, isTodosSelected, setCheckboxProducts]);
    return (
        <TableContainer
            w="100%"
            h={'85%'}
            overflowY="auto"
            overflowX="auto"
            position="relative"
            paddingX={3}
        >
            <Table variant="simple" bgColor="white" position="relative" style={{ minWidth: '800px' }}><Thead position="sticky" top={0} bg="gray.300" zIndex={1} boxShadow="0 1px 2px rgba(0, 0, 0, 0.1)">
                <Tr>
                    <Th textAlign="center">
                        <Checkbox
                            isChecked={isAllChecked}
                            isIndeterminate={isIndeterminate}
                            onChange={handleSelectAll}
                            borderColor={"gray.400"}
                        />
                    </Th>
                    <Th textAlign="center">
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('id')}>
                            {sortConfig.key === 'id' ? (
                                sortConfig.direction === 'asc' ? <TriangleUpIcon mr={1} /> : <TriangleDownIcon mr={1} />
                            ) : (
                                <TriangleUpIcon opacity={0.3} mr={1} />
                            )}
                            ID
                        </span>
                    </Th>
                    <Th textAlign="center">
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('nombre')}>
                            {sortConfig.key === 'nombre' ? (
                                sortConfig.direction === 'asc' ? <TriangleUpIcon mr={1} /> : <TriangleDownIcon mr={1} />
                            ) : (
                                <TriangleUpIcon opacity={0.3} mr={1} />
                            )}
                            Nombre
                        </span>
                    </Th>
                    <Th textAlign="center">
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('sku')}>
                            {sortConfig.key === 'sku' ? (
                                sortConfig.direction === 'asc' ? <TriangleUpIcon mr={1} /> : <TriangleDownIcon mr={1} />
                            ) : (
                                <TriangleUpIcon opacity={0.3} mr={1} />
                            )}
                            SKU
                        </span>
                    </Th>
                    <Th textAlign="center">
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('lote')}>
                            {sortConfig.key === 'lote' ? (
                                sortConfig.direction === 'asc' ? <TriangleUpIcon mr={1} /> : <TriangleDownIcon mr={1} />
                            ) : (
                                <TriangleUpIcon opacity={0.3} mr={1} />
                            )}
                            Lote
                        </span>
                    </Th>
                    <Th textAlign="center">
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            onClick={() => handleSort('cantidad')}>
                            {sortConfig.key === 'cantidad' ? (
                                sortConfig.direction === 'asc' ? <TriangleUpIcon mr={1} /> : <TriangleDownIcon mr={1} />
                            ) : (
                                <TriangleUpIcon opacity={0.3} mr={1} />
                            )}
                            Cantidad
                        </span>
                    </Th>
                    <Th textAlign="center">Acciones</Th>
                </Tr>
            </Thead><Tbody>
                    {sortedProducts.map((product, index) => {
                        const isSelected = isTodosSelected || selectedIds.includes(product.id);
                        const isOddRow = index % 2 === 1;
                        // Definir el estilo de fondo: azul si está seleccionado, gris claro si es impar, blanco si es par
                        const bgColor = isSelected
                            ? "blue.50"
                            : isOddRow
                                ? "gray.50"
                                : "white";

                        return (
                            <Tr
                                key={product.id}
                                bg={bgColor}
                                transition="background-color 0.2s"
                                _hover={{ bg: isSelected ? "blue.100" : "gray.100" }}
                            >
                                <Td textAlign="center">
                                    <Checkbox
                                        isChecked={isSelected}
                                        onChange={() => handleCheckboxChange(product.id)}
                                        borderColor={"gray.400"}
                                    />
                                </Td>
                                <Td textAlign="center">{product.id}</Td>
                                <Td textAlign="center">{product.nombre}</Td>
                                <Td textAlign="center">{product.sku}</Td>
                                <Td textAlign="center">{product.lote}</Td>
                                <Td textAlign="center">{product.cantidad}</Td>
                                <Td textAlign="center">
                                    <Tooltip label="Eliminar producto" placement="top">
                                        <IconButton
                                            aria-label="Eliminar producto"
                                            icon={<DeleteIcon />}
                                            colorScheme="red"
                                            size="sm"
                                            onClick={() => openDeleteDialog(product)}
                                        />
                                    </Tooltip>
                                </Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>

            {/* Diálogo de confirmación para eliminar producto */}
            <AlertDialog
                isOpen={isDeleteDialogOpen}
                leastDestructiveRef={cancelRef}
                onClose={cancelDelete}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Eliminar Producto
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {productToDelete && (
                                <>
                                    ¿Está seguro de que desea eliminar este producto?
                                    <br /><br />
                                    <b>ID:</b> {productToDelete.id}
                                    <br />
                                    <b>Nombre:</b> {productToDelete.nombre}
                                </>
                            )}
                        </AlertDialogBody>                        <AlertDialogFooter
                            display="flex"
                            justifyContent="center"
                            width="100%"
                        >
                            <Button
                                ref={cancelRef}
                                onClick={cancelDelete}
                                mr={3}
                                isDisabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={confirmDelete}
                                isLoading={isDeleting}
                                loadingText="Eliminando..."
                            >
                                Eliminar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </TableContainer>
    );
};

export default TableProducts;
