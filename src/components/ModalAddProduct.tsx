import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    VStack,
    useToast
} from '@chakra-ui/react';
import axios from 'axios';

interface ModalAddProductProps {
    isOpen: boolean;
    onClose: () => void;
    refreshProducts: () => void;
}

const ModalAddProduct: React.FC<ModalAddProductProps> = ({ isOpen, onClose, refreshProducts }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        sku: '',
        lote: '',
        cantidad: 0
    });

    const toast = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleNumberChange = (name: string, value: string) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSaveProduct = () => {
        axios.post(`${import.meta.env.VITE_API_URL}/productos/add/`, formData).then(response => {
            if (response.status === 201) {
                toast({
                    title: "Producto guardado",
                    description: "El producto ha sido agregado correctamente",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "top"
                });
            }
            setFormData({
                nombre: '',
                sku: '',
                lote: '',
                cantidad: 0
            });
            refreshProducts(); // Refrescar la lista de productos
            onClose();
        })
            .catch(error => {
                console.error(error);
                toast({
                    title: "Error al guardar el producto",
                    description: "Hubo un problema al agregar el producto. Inténtalo de nuevo.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "top"
                });
            });
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Agregar Producto</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Nombre del producto</FormLabel>
                            <Input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Aceite 15W40"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>SKU</FormLabel>
                            <Input
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                placeholder="Ej: ACE-001"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Lote</FormLabel>
                            <Input
                                name="lote"
                                value={formData.lote}
                                onChange={handleChange}
                                placeholder="Ej: L001"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Cantidad</FormLabel>
                            <NumberInput
                                min={0}
                                value={formData.cantidad}
                                onChange={(valueString) => handleNumberChange('cantidad', valueString)}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    width="100%"
                >
                    <Button colorScheme="blue" mr={3} onClick={handleSaveProduct}>
                        Guardar
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ModalAddProduct;