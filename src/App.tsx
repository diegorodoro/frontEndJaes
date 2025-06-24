import { useEffect, useState } from 'react';
import {
  Flex,
  Text,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  useToast,
  useDisclosure,
  Image
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaPlus, FaTag } from 'react-icons/fa';
import TableProducts from './components/TableProducts';
import ModalAddProduct from './components/ModalAddProduct';
import axios from 'axios';
import JaesLogo from './assets/jaes-logo.jpg';

interface CheckboxProduct {
  id: number;
  checked: true;
}

type CheckboxProductsState = CheckboxProduct[] | [{ todos: true }];

function App() {

  const [data, setData] = useState([]);
  const [checkboxProducts, setCheckboxProducts] = useState<CheckboxProductsState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Estado para forzar la recarga
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Función para recargar los productos
  const refreshProducts = () => {
    setRefreshTrigger(prev => prev + 1); // Incrementar para causar una recarga
  };

  useEffect(() => {
    // Función para obtener los productos desde la API
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/productos/`);
        setData(response.data);
      } catch (error) {
        console.error("Error al obtener productos:", error);
        toast({
          title: "Error de conexión",
          description: "No se pudieron cargar los productos. Por favor, intenta de nuevo.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top"
        });
      }
    };

    fetchProducts();
  }, [refreshTrigger]); // Solo depende de refreshTrigger para evitar llamadas innecesarias

  const handleGenerarEtiquetas = () => {
    // Verificar si no hay productos seleccionados o si se seleccionaron todos
    if (checkboxProducts.length === 0) {
      toast({
        title: "Selección requerida",
        description: "Por favor, selecciona al menos un producto para generar etiquetas.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
      return;
    }
    else {
      axios.post(`${import.meta.env.VITE_API_URL}/etiquetas/masivas/`,
        checkboxProducts,
        { responseType: 'blob' }  // Indica que esperamos un archivo binario
      )
        .then(response => {
          // Crear un URL para el blob recibido
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);

          // Crear un elemento de enlace para descargar el PDF
          const link = document.createElement('a');
          link.href = url;
          link.download = 'etiquetas.pdf'; // Nombre del archivo para descargar
          document.body.appendChild(link);

          // Descargar el PDF
          link.click();

          // Limpiar y abrir el PDF en una nueva pestaña
          setTimeout(() => {
            document.body.removeChild(link);
            window.open(url, '_blank'); // Abre el PDF en una nueva pestaña
          }, 100);

          toast({
            title: "Etiquetas generadas",
            description: "Las etiquetas se han generado y descargado correctamente.",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top"
          });
        })
        .catch(error => {
          console.error(error);
          toast({
            title: "Error al generar etiquetas",
            description: "Ocurrió un error al intentar generar las etiquetas.",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top"
          });
        });
    }
  }

  return (
    <Flex
      w="100vw"
      h="100vh"
      bgColor="gray.300"
      flexDirection="column"
      alignItems="center"
    >
      <Box
        display={'flex'}
        flexDirection="row"
        alignItems="center"
        gap={5}
        bgColor="white"
        w='100%'
        paddingX={6}
        paddingY={3}
        borderBottom="1px solid"
        borderBottomColor="gray.300"
      >
        <Image
          src={JaesLogo}
          alt="Jaes Logo"
          objectFit="contain"
          w="5%"
        />
        <Box
          height="100%"
          width="3px"
          backgroundColor="gray.300"
        />
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="black"
          textAlign="center"
        >
          Generador de Etiquetas de Productos
        </Text>
      </Box>

      <Flex
        flexDirection="column"
        w="calc(100% - 50px)"  /* Restamos 200px de cada lado */
        h="calc(100vh - 140px)"  /* Restamos 200px de cada lado */
        bgColor="white"
        borderRadius={'30px'}
        mt={3}
      >
        <Box
          w='100%'
          p={6}
          display="flex"
          justifyContent="space-between"
        >
          <InputGroup
            w={'30%'}
          >
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Buscar producto..."
              borderRadius="full"
              bgColor="white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Box
            display="flex"
            gap={4}
          >
            <Button
              colorScheme="green"
              leftIcon={<FaPlus />}
              _hover={{ bg: "green.600", transform: "translateY(-2px)" }}
              _active={{ bg: "green.700" }}
              boxShadow="md"
              transition="all 0.2s"
              size="md"
              borderRadius="md"
              onClick={onOpen}
            >
              <Text fontSize="md" fontWeight="bold">Agregar Producto</Text>
            </Button>

            <Button
              colorScheme="blue"
              onClick={handleGenerarEtiquetas}
              leftIcon={<FaTag />}
              _hover={{ bg: "blue.600", transform: "translateY(-2px)" }}
              _active={{ bg: "blue.700" }}
              boxShadow="md"
              transition="all 0.2s"
              size="md"
              borderRadius="md"
            >
              <Text fontSize="md" fontWeight="bold">Generar etiquetas</Text>
            </Button>
          </Box>
        </Box>

        <TableProducts
          data={data}
          setCheckboxProducts={setCheckboxProducts}
          searchTerm={searchTerm}
          refreshProducts={refreshProducts}
        />
      </Flex>

      <ModalAddProduct
        isOpen={isOpen}
        onClose={onClose}
        refreshProducts={refreshProducts}
      />
    </Flex>
  );
}

export default App;
